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

/** Derive a base handle from email local-part (may need suffix for uniqueness). */
export const deriveHandleBaseFromEmail = (email: string): string => {
    const local = email.split('@')[0]?.toLowerCase() ?? 'user';
    let base = local.replace(/[^a-z0-9_]/g, '');
    if (base.length < 3) {
        base = base.padEnd(3, '0');
    }
    if (base.length > 20) {
        base = base.slice(0, 20);
    }
    return base;
};

export const withNumericSuffix = (base: string, suffix: number): string => {
    const suffixStr = String(suffix);
    const maxBase = Math.max(3, 20 - suffixStr.length);
    return base.slice(0, maxBase) + suffixStr;
};
