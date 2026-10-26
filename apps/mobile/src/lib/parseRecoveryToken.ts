/** Parse recovery access_token from a password-reset deep link URL. */
export const parseRecoveryToken = (url: string): string | null => {
    try {
        const hashPart = url.includes('#') ? url.split('#').slice(1).join('#') : '';
        const queryPart = url.includes('?') ? url.split('?')[1]?.split('#')[0] ?? '' : '';
        const params = new URLSearchParams(hashPart || queryPart);
        const token = params.get('access_token');
        const type = params.get('type');
        if (token && (type === 'recovery' || url.includes('reset-password'))) {
            return token;
        }
    } catch {
        // ignore malformed URLs
    }
    return null;
};
