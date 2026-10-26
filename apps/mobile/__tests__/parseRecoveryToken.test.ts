import { describe, expect, it } from 'vitest';
import { parseRecoveryToken } from '../src/lib/parseRecoveryToken';

describe('parseRecoveryToken', () => {
    it('parses access_token from hash fragment', () => {
        const url =
            'luku://reset-password#access_token=abc123&type=recovery&expires_in=3600';
        expect(parseRecoveryToken(url)).toBe('abc123');
    });

    it('parses access_token from query string', () => {
        const url = 'luku://reset-password?access_token=xyz&type=recovery';
        expect(parseRecoveryToken(url)).toBe('xyz');
    });

    it('returns null when token missing', () => {
        expect(parseRecoveryToken('luku://reset-password')).toBeNull();
    });
});
