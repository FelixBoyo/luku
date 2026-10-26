/** Stable machine-readable error codes for clients */
export type ErrorCode =
    | 'VALIDATION_FAILED'
    | 'ROUTE_NOT_FOUND'
    | 'CONFLICT'
    | 'AUTH_UNAUTHORIZED'
    | 'AUTH_FORBIDDEN'
    | 'AUTH_TOKEN_EXPIRED'
    | 'AUTH_EMAIL_UNCONFIRMED'
    | 'AUTH_UNAVAILABLE'
    | 'UNKNOWN_ERROR'
    | 'AI_PROVIDER_TIMEOUT'
    | 'AI_PARSE_FAILED'
    | 'PAYMENTS_CONFIG_ERROR'
    | 'PAYSTACK_CHARGE_FAILED'
    | 'MULTI_SELLER_NOT_ALLOWED'
    | 'CANNOT_BUY_OWN_ITEM'
    | 'PAYOUT_DETAILS_REQUIRED'
    | 'SERVER_MISCONFIGURED'
    | 'ESCROW_BACKEND_TIMEOUT';

export type Pagination = {
    page: number;
    limit: number;
    total: number;
    pages: number;
};

export type PaginatedItems<T> = {
    items: T[];
    pagination: Pagination;
};

export type ApiResponse<T = unknown> = {
    success: boolean;
    status: string;
    code: number;
    errorCode: ErrorCode | null;
    message: string;
    error: string | null;
    data: T;
    timestamp: string;
};

export type ApiErrorResponse = ApiResponse<null> & {
    errors?: unknown[];
};
