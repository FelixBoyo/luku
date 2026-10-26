import { describe, expect, it } from 'vitest';
import { assertServiceRoleKey } from './supabaseEnv';

/** Builds an unsigned JWT-shaped string; only the payload is ever read. */
const fakeJwt = (payload: Record<string, unknown>): string => {
    const encode = (value: unknown) =>
        Buffer.from(JSON.stringify(value)).toString('base64url');
    return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
};

const PROJECT = { SUPABASE_URL: 'https://abcdefghijklm.supabase.co' };

describe('assertServiceRoleKey', () => {
    it('accepts a new-format secret key', () => {
        expect(
            assertServiceRoleKey({
                ...PROJECT,
                SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_abc123',
            })
        ).toEqual([]);
    });

    it('accepts a legacy service_role JWT', () => {
        expect(
            assertServiceRoleKey({
                ...PROJECT,
                SUPABASE_SERVICE_ROLE_KEY: fakeJwt({
                    role: 'service_role',
                    ref: 'abcdefghijklm',
                }),
            })
        ).toEqual([]);
    });

    it('rejects a publishable key', () => {
        expect(() =>
            assertServiceRoleKey({
                ...PROJECT,
                SUPABASE_SERVICE_ROLE_KEY: 'sb_publishable_abc123',
            })
        ).toThrow('publishable key');
    });

    it('rejects an anon JWT', () => {
        expect(() =>
            assertServiceRoleKey({
                ...PROJECT,
                SUPABASE_SERVICE_ROLE_KEY: fakeJwt({ role: 'anon', ref: 'abcdefghijklm' }),
            })
        ).toThrow('expected "service_role"');
    });

    it('rejects an unrecognized key format', () => {
        expect(() =>
            assertServiceRoleKey({ ...PROJECT, SUPABASE_SERVICE_ROLE_KEY: 'not-a-key' })
        ).toThrow('not a recognized Supabase key');
    });

    it('rejects a missing key', () => {
        expect(() => assertServiceRoleKey({ ...PROJECT })).toThrow(
            'SUPABASE_SERVICE_ROLE_KEY is required'
        );
    });

    it('never echoes the key in the error message', () => {
        const secret = fakeJwt({ role: 'anon', ref: 'abcdefghijklm' });
        expect(() =>
            assertServiceRoleKey({ ...PROJECT, SUPABASE_SERVICE_ROLE_KEY: secret })
        ).toThrow(
            expect.objectContaining({
                message: expect.not.stringContaining(secret),
            })
        );
    });

    it('warns without throwing when the key belongs to another project', () => {
        const warnings = assertServiceRoleKey({
            ...PROJECT,
            SUPABASE_SERVICE_ROLE_KEY: fakeJwt({ role: 'service_role', ref: 'otherproject' }),
        });

        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain('otherproject');
    });

    it('warns without throwing when the key has expired', () => {
        const warnings = assertServiceRoleKey({
            ...PROJECT,
            SUPABASE_SERVICE_ROLE_KEY: fakeJwt({
                role: 'service_role',
                ref: 'abcdefghijklm',
                exp: Math.floor(Date.now() / 1000) - 60,
            }),
        });

        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain('expired');
    });

    it('prefers SUPABASE_PROJECT_ID over the URL host', () => {
        expect(
            assertServiceRoleKey({
                SUPABASE_URL: 'https://wrong.supabase.co',
                SUPABASE_PROJECT_ID: 'abcdefghijklm',
                SUPABASE_SERVICE_ROLE_KEY: fakeJwt({
                    role: 'service_role',
                    ref: 'abcdefghijklm',
                }),
            })
        ).toEqual([]);
    });
});
