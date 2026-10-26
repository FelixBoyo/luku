import type { ApiResponse, ErrorCode } from '../../packages/contracts/src/envelope';

export type { ApiResponse, ErrorCode };

export const createResponse = <T>(
    data: T,
    message = '',
    status = 'success',
    code = 200,
    errorCode: ErrorCode | null = null,
): ApiResponse<T> => {
    const isSuccess = status !== 'error' && code < 400;
    return {
        success: isSuccess,
        status,
        code,
        errorCode: isSuccess ? null : errorCode ?? 'UNKNOWN_ERROR',
        message,
        error: isSuccess ? null : message || 'Request failed',
        data,
        timestamp: new Date().toISOString(),
    };
};

export const createErrorResponse = (
    message: string,
    code = 500,
    errorCode: ErrorCode = 'UNKNOWN_ERROR',
    errors: unknown[] = [],
): ApiResponse<null> & { errors?: unknown[] } => ({
    success: false,
    status: 'error',
    code,
    errorCode,
    message,
    error: message,
    data: null,
    timestamp: new Date().toISOString(),
    ...(errors.length > 0 ? { errors } : {}),
});
