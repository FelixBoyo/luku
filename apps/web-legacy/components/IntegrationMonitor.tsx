/**
 * Integration Monitor Component
 * Displays health status and metrics for all third-party integrations
 */

import React, { useState, useEffect } from 'react';
import { integrationManager, ServiceHealth } from '../services/integrationManager';
import { errorLogger } from '../services/errorLogger';
import { getServiceStatus } from '../services/integrationConfig';
import { getIntegrationConfig } from '../services/integrationConfig';
import Spinner from './common/Spinner';

const IntegrationMonitor: React.FC = () => {
    const [healthStatus, setHealthStatus] = useState<Map<string, ServiceHealth>>(new Map());
    const [overallHealth, setOverallHealth] = useState<{
        status: 'healthy' | 'degraded' | 'down';
        services: ServiceHealth[];
    } | null>(null);
    const [errorStats, setErrorStats] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const checkHealth = async () => {
        setLoading(true);
        try {
            const health = await integrationManager.checkAllServicesHealth();
            const overall = integrationManager.getOverallHealth();
            const config = getIntegrationConfig();
            const status = getServiceStatus(config);

            setHealthStatus(health);
            setOverallHealth(overall);

            // Get error stats for each service
            const stats: Record<string, any> = {};
            ['stripe', 'supabase', 'gemini'].forEach((service) => {
                stats[service] = errorLogger.getErrorStats(service as any);
            });
            setErrorStats(stats);
        } catch (error) {
            console.error('Error checking health:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkHealth();

        if (autoRefresh) {
            const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'text-green-600 bg-green-50';
            case 'degraded':
                return 'text-yellow-600 bg-yellow-50';
            case 'down':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return '✓';
            case 'degraded':
                return '⚠';
            case 'down':
                return '✗';
            default:
                return '?';
        }
    };

    const services = ['stripe', 'supabase', 'gemini', 'mpesa'] as const;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    Integration Monitor
                </h2>
                <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        <span>Auto-refresh</span>
                    </label>
                    <button
                        onClick={checkHealth}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? <Spinner /> : 'Refresh'}
                    </button>
                </div>
            </div>

            {overallHealth && (
                <div className="mb-6">
                    <div
                        className={`inline-flex items-center px-4 py-2 rounded-lg ${getStatusColor(
                            overallHealth.status
                        )}`}
                    >
                        <span className="font-semibold mr-2">
                            Overall Status: {overallHealth.status.toUpperCase()}
                        </span>
                        <span className="text-lg">
                            {getStatusIcon(overallHealth.status)}
                        </span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {services.map((service) => {
                    const health = healthStatus.get(service);
                    const stats = errorStats[service] || {
                        total: 0,
                        bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
                        recent: 0,
                    };

                    return (
                        <div
                            key={service}
                            className="border border-gray-200 rounded-lg p-4"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900 capitalize">
                                    {service}
                                </h3>
                                {health && (
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                            health.status
                                        )}`}
                                    >
                                        {getStatusIcon(health.status)}{' '}
                                        {health.status}
                                    </span>
                                )}
                            </div>

                            {health && (
                                <div className="space-y-2 text-sm text-gray-600">
                                    {health.responseTime && (
                                        <div>
                                            Response Time:{' '}
                                            <span className="font-medium">
                                                {health.responseTime}ms
                                            </span>
                                        </div>
                                    )}
                                    {health.lastChecked && (
                                        <div>
                                            Last Checked:{' '}
                                            <span className="font-medium">
                                                {new Date(
                                                    health.lastChecked
                                                ).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    )}
                                    {health.error && (
                                        <div className="text-red-600 text-xs">
                                            {health.error}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="text-xs text-gray-500 space-y-1">
                                    <div>
                                        Total Errors: <span className="font-medium">{stats.total}</span>
                                    </div>
                                    <div>
                                        Recent (1h): <span className="font-medium">{stats.recent}</span>
                                    </div>
                                    {stats.bySeverity.critical > 0 && (
                                        <div className="text-red-600">
                                            Critical: {stats.bySeverity.critical}
                                        </div>
                                    )}
                                    {stats.bySeverity.high > 0 && (
                                        <div className="text-orange-600">
                                            High: {stats.bySeverity.high}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                    Integration Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {services.map((service) => {
                        const metrics = integrationManager.getMetrics(service);
                        const successRate =
                            metrics.totalRequests > 0
                                ? (
                                      (metrics.successfulRequests /
                                          metrics.totalRequests) *
                                      100
                                  ).toFixed(1)
                                : '0';

                        return (
                            <div key={service} className="capitalize">
                                <div className="font-medium text-gray-700 mb-1">
                                    {service}
                                </div>
                                <div className="text-gray-600 space-y-1">
                                    <div>
                                        Requests: {metrics.totalRequests}
                                    </div>
                                    <div>
                                        Success Rate: {successRate}%
                                    </div>
                                    {metrics.averageResponseTime > 0 && (
                                        <div>
                                            Avg Response:{' '}
                                            {metrics.averageResponseTime.toFixed(0)}ms
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default IntegrationMonitor;
