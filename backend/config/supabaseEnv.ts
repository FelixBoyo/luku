/**
 * Boot-time guard for the Supabase server key.
 *
 * `payments`, `orders` and the webhook tables rely on RLS being bypassed by the
 * service role. A lower-privilege key still builds a working client, so the
 * mistake only surfaces as "new row violates row-level security policy" midway
 * through checkout — after the buyer has already been charged. Failing at boot
 * turns that into a startup error instead of stranded money.
 *
 * Never include the key itself in a message: these strings reach logs.
 */

import { createHash } from 'node:crypto';

export type ServiceRoleKeyWarning = string;

const SECRET_PREFIX = 'sb_secret_';
const PUBLISHABLE_PREFIX = 'sb_publishable_';

const decodeJwtPayload = (key: string): Record<string, unknown> | null => {
    const parts = key.split('.');
    if (parts.length !== 3) {
        return null;
    }

    try {
        const json = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(json);
        return payload && typeof payload === 'object' ? payload : null;
    } catch {
        return null;
    }
};

/** Project ref from either the explicit id or the `<ref>.supabase.co` host. */
const resolveExpectedProjectRef = (env: NodeJS.ProcessEnv): string | undefined => {
    const explicit = env.SUPABASE_PROJECT_ID?.trim();
    if (explicit) {
        return explicit;
    }

    const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
    if (!url) {
        return undefined;
    }

    try {
        const host = new URL(url).hostname;
        const [ref] = host.split('.');
        return ref || undefined;
    } catch {
        return undefined;
    }
};

export type ServiceRoleKeyDescription = {
    kind: 'missing' | 'secret' | 'publishable' | 'jwt' | 'unrecognized';
    role?: string;
    projectRef?: string;
    expectedProjectRef?: string;
    /**
     * Short digest of the key. Safe to log, and the only way to tell whether a
     * running process picked up an edited file without revealing either key.
     */
    fingerprint?: string;
};

/** Loggable summary of the configured key. Never includes the key itself. */
export const describeServiceRoleKey = (env: NodeJS.ProcessEnv): ServiceRoleKeyDescription => {
    const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const expectedProjectRef = resolveExpectedProjectRef(env);

    if (!key) {
        return { kind: 'missing', expectedProjectRef };
    }

    const fingerprint = createHash('sha256').update(key).digest('hex').slice(0, 8);

    if (key.startsWith(SECRET_PREFIX)) {
        return { kind: 'secret', expectedProjectRef, fingerprint };
    }

    if (key.startsWith(PUBLISHABLE_PREFIX)) {
        return { kind: 'publishable', expectedProjectRef, fingerprint };
    }

    const payload = decodeJwtPayload(key);
    if (!payload) {
        return { kind: 'unrecognized', expectedProjectRef, fingerprint };
    }

    return {
        kind: 'jwt',
        role: typeof payload.role === 'string' ? payload.role : undefined,
        projectRef: typeof payload.ref === 'string' ? payload.ref : undefined,
        expectedProjectRef,
        fingerprint,
    };
};

/**
 * Throws when `SUPABASE_SERVICE_ROLE_KEY` is not a service-role credential.
 * Returns non-fatal warnings (wrong project, expired) for the caller to log.
 */
export const assertServiceRoleKey = (env: NodeJS.ProcessEnv): ServiceRoleKeyWarning[] => {
    const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!key) {
        throw new Error(
            'SUPABASE_SERVICE_ROLE_KEY is required on the server. Set it to the Supabase secret (service_role) key.'
        );
    }

    if (key.startsWith(PUBLISHABLE_PREFIX)) {
        throw new Error(
            'SUPABASE_SERVICE_ROLE_KEY holds a publishable key (sb_publishable_...). ' +
                'Use the secret key (sb_secret_...) instead — the publishable key cannot bypass RLS, so order and payment writes will fail.'
        );
    }

    const warnings: ServiceRoleKeyWarning[] = [];

    if (key.startsWith(SECRET_PREFIX)) {
        return warnings;
    }

    const payload = decodeJwtPayload(key);
    if (!payload) {
        throw new Error(
            'SUPABASE_SERVICE_ROLE_KEY is not a recognized Supabase key. ' +
                'Expected a secret key (sb_secret_...) or a legacy service_role JWT.'
        );
    }

    const role = typeof payload.role === 'string' ? payload.role : undefined;
    if (role !== 'service_role') {
        throw new Error(
            `SUPABASE_SERVICE_ROLE_KEY has role "${role ?? 'unknown'}", expected "service_role". ` +
                'An anon key cannot bypass RLS, so order and payment writes will fail.'
        );
    }

    const expectedRef = resolveExpectedProjectRef(env);
    const keyRef = typeof payload.ref === 'string' ? payload.ref : undefined;
    if (expectedRef && keyRef && expectedRef !== keyRef) {
        warnings.push(
            `SUPABASE_SERVICE_ROLE_KEY belongs to project "${keyRef}" but SUPABASE_URL points at "${expectedRef}".`
        );
    }

    const exp = typeof payload.exp === 'number' ? payload.exp : undefined;
    if (exp && exp * 1000 < Date.now()) {
        warnings.push(
            `SUPABASE_SERVICE_ROLE_KEY expired on ${new Date(exp * 1000).toISOString()}.`
        );
    }

    return warnings;
};
