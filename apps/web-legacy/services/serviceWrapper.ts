/**
 * Service Wrapper
 * Provides consistent error handling, retry logic, and metrics for all service calls
 */

import { ServiceName, integrationManager } from './integrationManager';
import { errorLogger } from './errorLogger';
import { withRetry, RetryOptions } from './retryHandler';

export interface ServiceCallOptions {
    service: ServiceName;
    operation: string;
    retryOptions?: RetryOptions;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    context?: Record<string, any>;
}

/**
 * Wrap a service call with error handling, retry logic, and metrics
 */
export async function withServiceWrapper<T>(
    fn: () => Promise<T>,
    options: ServiceCallOptions
): Promise<T> {
    const { service, operation, retryOptions, severity = 'medium', context = {} } = options;
    const startTime = Date.now();

    try {
        // Execute with retry logic if provided
        const result = retryOptions
            ? await withRetry(fn, retryOptions)
            : await fn();

        // Record successful request
        const responseTime = Date.now() - startTime;
        integrationManager.recordRequest(service, true, responseTime);

        return result;
    } catch (error: any) {
        const responseTime = Date.now() - startTime;

        // Record failed request
        integrationManager.recordRequest(service, false, responseTime, error.message);

        // Log error
        errorLogger.log(service, error, { operation, ...context }, severity);

        // Re-throw for caller to handle
        throw error;
    }
}

/**
 * Create a service wrapper function
 */
export function createServiceWrapper<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    defaultOptions: Omit<ServiceCallOptions, 'operation'>
): T {
    return (async (...args: Parameters<T>) => {
        const operation = fn.name || 'unknown';
        return withServiceWrapper(() => fn(...args), {
            ...defaultOptions,
            operation,
        });
    }) as T;
}
