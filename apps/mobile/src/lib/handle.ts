export const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;

export const normalizeHandleInput = (raw: string): string =>
    raw.trim().replace(/^@/, '').toLowerCase();

export const isValidHandleFormat = (handle: string): boolean => HANDLE_REGEX.test(handle);

export const formatHandleForDisplay = (handle: string | null | undefined): string => {
    if (!handle?.trim()) {
        return '@user';
    }
    const bare = handle.replace(/^@/, '');
    return `@${bare}`;
};
