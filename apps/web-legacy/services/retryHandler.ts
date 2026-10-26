/**
 * Retry Handler
 * Provides retry logic with exponential backoff for API calls
 */

export interface RetryOptions {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    retryableErrors?: string[];
    onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryableErrors' | 'onRetry'>> & {
    retryableErrors: string[];
    onRetry?: (attempt: number, error: Error) => void;
} = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ECONNREFUSED',
        'TIMEOUT',
        'NetworkError',
        'Failed to fetch',
    ],
};

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error, retryableErrors: string[]): boolean {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    return retryableErrors.some(
        (retryable) =>
            errorMessage.includes(retryable.toLowerCase()) ||
            errorName.includes(retryable.toLowerCase())
    );
}

/**
 * Calculate delay for retry with exponential backoff
 */
function calculateDelay(
    attempt: number,
    initialDelay: number,
    maxDelay: number,
    backoffMultiplier: number
): number {
    const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
    return Math.min(delay, maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError: Error;

    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Don't retry on last attempt
            if (attempt === opts.maxRetries) {
                break;
            }

            // Check if error is retryable
            if (!isRetryableError(error, opts.retryableErrors)) {
                throw error;
            }

            // Call onRetry callback if provided
            if (opts.onRetry) {
                opts.onRetry(attempt, error);
            }

            // Calculate delay and wait
            const delay = calculateDelay(
                attempt,
                opts.initialDelay,
                opts.maxDelay,
                opts.backoffMultiplier
            );
            await sleep(delay);
        }
    }

    throw lastError!;
}

/**
 * Create a retry wrapper for a function
 */
export function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: RetryOptions = {}
): T {
    return (async (...args: Parameters<T>) => {
        return withRetry(() => fn(...args), options);
    }) as T;
}
