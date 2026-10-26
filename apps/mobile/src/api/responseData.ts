import type { ApiResponse, PaginatedItems } from '../../../../packages/contracts/src/envelope';

export function unwrapApiData<T>(payload: unknown): T {
    if (payload && typeof payload === 'object' && 'data' in (payload as object)) {
        return (payload as ApiResponse<T>).data;
    }
    return payload as T;
}

export function extractListData<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) return payload as T[];

    const unwrapped = unwrapApiData<unknown>(payload);
    if (Array.isArray(unwrapped)) return unwrapped as T[];

    if (unwrapped && typeof unwrapped === 'object') {
        const obj = unwrapped as PaginatedItems<T> & Record<string, unknown>;
        if (Array.isArray(obj.items)) return obj.items;
        if (Array.isArray(obj.records)) return obj.records as T[];
    }
    return [];
}
