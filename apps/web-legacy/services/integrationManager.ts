/**
 * Integration Manager
 * Centralized service for managing and monitoring third-party integrations
 */

import { getIntegrationConfig, validateIntegrationConfig } from './integrationConfig';

export type ServiceName = 'stripe' | 'supabase' | 'gemini' | 'mpesa';

export interface ServiceHealth {
    service: ServiceName;
    status: 'healthy' | 'degraded' | 'down' | 'unknown';
    lastChecked: number;
    responseTime?: number;
    error?: string;
    retryCount?: number;
}

export interface IntegrationMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    lastError?: {
        message: string;
        timestamp: number;
        service: ServiceName;
    };
}

class IntegrationManager {
    private healthStatus: Map<ServiceName, ServiceHealth> = new Map();
    private metrics: Map<ServiceName, IntegrationMetrics> = new Map();
    private config = getIntegrationConfig();

    constructor() {
        this.initializeServices();
    }

    private initializeServices() {
        const services: ServiceName[] = ['stripe', 'supabase', 'gemini', 'mpesa'];
        services.forEach((service) => {
            this.healthStatus.set(service, {
                service,
                status: 'unknown',
                lastChecked: 0,
            });

            this.metrics.set(service, {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0,
            });
        });
    }

    /**
     * Check health of a specific service
     */
    async checkServiceHealth(service: ServiceName): Promise<ServiceHealth> {
        const startTime = Date.now();
        let health: ServiceHealth;

        try {
            switch (service) {
                case 'stripe':
                    health = await this.checkStripeHealth();
                    break;
                case 'supabase':
                    health = await this.checkSupabaseHealth();
                    break;
                case 'gemini':
                    health = await this.checkGeminiHealth();
                    break;
                case 'mpesa':
                    health = await this.checkMpesaHealth();
                    break;
                default:
                    health = {
                        service,
                        status: 'unknown',
                        lastChecked: Date.now(),
                        error: 'Unknown service',
                    };
            }

            health.responseTime = Date.now() - startTime;
            this.healthStatus.set(service, health);
            return health;
        } catch (error: any) {
            health = {
                service,
                status: 'down',
                lastChecked: Date.now(),
                responseTime: Date.now() - startTime,
                error: error.message || 'Health check failed',
            };
            this.healthStatus.set(service, health);
            return health;
        }
    }

    private async checkStripeHealth(): Promise<ServiceHealth> {
        if (!this.config.stripe.enabled) {
            return {
                service: 'stripe',
                status: 'down',
                lastChecked: Date.now(),
                error: 'Stripe is not configured',
            };
        }

        // Basic check - in production, you might ping Stripe's API
        return {
            service: 'stripe',
            status: 'healthy',
            lastChecked: Date.now(),
        };
    }

    private async checkSupabaseHealth(): Promise<ServiceHealth> {
        if (!this.config.supabase.enabled) {
            return {
                service: 'supabase',
                status: 'down',
                lastChecked: Date.now(),
                error: 'Supabase is not configured',
            };
        }

        try {
            // Simple health check - try to access Supabase
            const { supabase } = await import('./supabaseClient');
            const { error } = await supabase.from('profiles').select('count').limit(1);

            if (error && error.code !== 'PGRST301') {
                return {
                    service: 'supabase',
                    status: 'degraded',
                    lastChecked: Date.now(),
                    error: error.message,
                };
            }

            return {
                service: 'supabase',
                status: 'healthy',
                lastChecked: Date.now(),
            };
        } catch (error: any) {
            return {
                service: 'supabase',
                status: 'down',
                lastChecked: Date.now(),
                error: error.message,
            };
        }
    }

    private async checkGeminiHealth(): Promise<ServiceHealth> {
        if (!this.config.gemini.enabled) {
            return {
                service: 'gemini',
                status: 'down',
                lastChecked: Date.now(),
                error: 'Gemini API is not configured',
            };
        }

        // Basic configuration check
        // In production, you might make a lightweight API call
        return {
            service: 'gemini',
            status: 'healthy',
            lastChecked: Date.now(),
        };
    }

    private async checkMpesaHealth(): Promise<ServiceHealth> {
        if (!this.config.mpesa.enabled) {
            return {
                service: 'mpesa',
                status: 'down',
                lastChecked: Date.now(),
                error: 'M-Pesa is not configured',
            };
        }

        // Basic configuration check – in production, you might call a lightweight health endpoint
        return {
            service: 'mpesa',
            status: 'healthy',
            lastChecked: Date.now(),
        };
    }

    /**
     * Check health of all services
     */
    async checkAllServicesHealth(): Promise<Map<ServiceName, ServiceHealth>> {
        const services: ServiceName[] = ['stripe', 'supabase', 'gemini', 'mpesa'];
        await Promise.all(services.map((service) => this.checkServiceHealth(service)));
        return new Map(this.healthStatus);
    }

    /**
     * Record a service request for metrics
     */
    recordRequest(
        service: ServiceName,
        success: boolean,
        responseTime: number,
        error?: string
    ) {
        const metrics = this.metrics.get(service) || {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
        };

        metrics.totalRequests++;
        if (success) {
            metrics.successfulRequests++;
        } else {
            metrics.failedRequests++;
            if (error) {
                metrics.lastError = {
                    message: error,
                    timestamp: Date.now(),
                    service,
                };
            }
        }

        // Update average response time
        const totalTime =
            metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime;
        metrics.averageResponseTime = totalTime / metrics.totalRequests;

        this.metrics.set(service, metrics);
    }

    /**
     * Get current health status
     */
    getHealthStatus(service?: ServiceName): ServiceHealth | Map<ServiceName, ServiceHealth> {
        if (service) {
            return this.healthStatus.get(service) || {
                service,
                status: 'unknown',
                lastChecked: 0,
            };
        }
        return new Map(this.healthStatus);
    }

    /**
     * Get metrics for a service
     */
    getMetrics(service?: ServiceName): IntegrationMetrics | Map<ServiceName, IntegrationMetrics> {
        if (service) {
            return (
                this.metrics.get(service) || {
                    totalRequests: 0,
                    successfulRequests: 0,
                    failedRequests: 0,
                    averageResponseTime: 0,
                }
            );
        }
        return new Map(this.metrics);
    }

    /**
     * Get overall system health
     */
    getOverallHealth(): {
        status: 'healthy' | 'degraded' | 'down';
        services: ServiceHealth[];
    } {
        const services = Array.from(this.healthStatus.values());
        const downServices = services.filter((s) => s.status === 'down');
        const degradedServices = services.filter((s) => s.status === 'degraded');

        let status: 'healthy' | 'degraded' | 'down' = 'healthy';
        if (downServices.length > 0) {
            status = 'down';
        } else if (degradedServices.length > 0) {
            status = 'degraded';
        }

        return {
            status,
            services,
        };
    }

    /**
     * Validate configuration
     */
    validateConfig() {
        return validateIntegrationConfig(this.config);
    }
}

// Singleton instance
export const integrationManager = new IntegrationManager();

// Auto-check health on initialization (non-blocking)
if (typeof window !== 'undefined') {
    setTimeout(() => {
        integrationManager.checkAllServicesHealth().catch(console.error);
    }, 2000);
}
