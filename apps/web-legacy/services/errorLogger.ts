/**
 * Error Logger
 * Centralized error logging and tracking for integrations
 */

import { ServiceName } from './integrationManager';

export interface ErrorLog {
    id: string;
    service: ServiceName;
    error: Error;
    context?: Record<string, any>;
    timestamp: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolved: boolean;
}

class ErrorLogger {
    private logs: ErrorLog[] = [];
    private maxLogs = 1000; // Keep last 1000 errors

    /**
     * Log an error
     */
    log(
        service: ServiceName,
        error: Error,
        context?: Record<string, any>,
        severity: ErrorLog['severity'] = 'medium'
    ): string {
        const log: ErrorLog = {
            id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            service,
            error,
            context,
            timestamp: Date.now(),
            severity,
            resolved: false,
        };

        this.logs.push(log);

        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Log to console in development
        if (import.meta.env.DEV) {
            console.error(`[${service}] Error:`, error, context);
        }

        // In production, you might want to send to an error tracking service
        // like Sentry, LogRocket, etc.
        this.sendToErrorTracking(log);

        return log.id;
    }

    /**
     * Get recent errors for a service
     */
    getRecentErrors(
        service?: ServiceName,
        limit: number = 50
    ): ErrorLog[] {
        let filtered = this.logs;

        if (service) {
            filtered = this.logs.filter((log) => log.service === service);
        }

        return filtered
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    /**
     * Get error statistics
     */
    getErrorStats(service?: ServiceName): {
        total: number;
        bySeverity: Record<ErrorLog['severity'], number>;
        recent: number; // Errors in last hour
    } {
        let filtered = this.logs;

        if (service) {
            filtered = this.logs.filter((log) => log.service === service);
        }

        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const recent = filtered.filter((log) => log.timestamp > oneHourAgo);

        const bySeverity: Record<ErrorLog['severity'], number> = {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0,
        };

        filtered.forEach((log) => {
            bySeverity[log.severity]++;
        });

        return {
            total: filtered.length,
            bySeverity,
            recent: recent.length,
        };
    }

    /**
     * Mark an error as resolved
     */
    markResolved(errorId: string): boolean {
        const log = this.logs.find((l) => l.id === errorId);
        if (log) {
            log.resolved = true;
            return true;
        }
        return false;
    }

    /**
     * Clear old resolved errors
     */
    clearResolved(olderThanDays: number = 7): number {
        const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
        const before = this.logs.length;
        this.logs = this.logs.filter(
            (log) => !log.resolved || log.timestamp > cutoff
        );
        return before - this.logs.length;
    }

    /**
     * Send error to external tracking service (placeholder)
     */
    private sendToErrorTracking(log: ErrorLog) {
        // In production, integrate with services like:
        // - Sentry
        // - LogRocket
        // - Datadog
        // - Custom error tracking API

        // Example:
        // if (import.meta.env.PROD) {
        //     Sentry.captureException(log.error, {
        //         tags: { service: log.service, severity: log.severity },
        //         extra: log.context,
        //     });
        // }
    }

    /**
     * Export logs for analysis
     */
    exportLogs(service?: ServiceName): ErrorLog[] {
        if (service) {
            return this.logs.filter((log) => log.service === service);
        }
        return [...this.logs];
    }
}

// Singleton instance
export const errorLogger = new ErrorLogger();
