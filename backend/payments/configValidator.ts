import { resolveEscrowPolicy, type EscrowPolicy } from './escrowPolicy';

export type PaymentsEnvMode = 'test' | 'live';

export interface PaymentsEnvValidationResult {
    mode: PaymentsEnvMode;
    escrow: EscrowPolicy;
}

const inferKeyMode = (key: string | undefined): PaymentsEnvMode | null => {
    if (!key) {
        return null;
    }

    if (key.startsWith('sk_test_') || key.startsWith('pk_test_')) {
        return 'test';
    }

    if (key.startsWith('sk_live_') || key.startsWith('pk_live_')) {
        return 'live';
    }

    return null;
};

export const validatePaymentsEnvironment = (
    env: NodeJS.ProcessEnv
): PaymentsEnvValidationResult => {
    const rawMode = env.PAYMENTS_ENV_MODE?.trim().toLowerCase();

    if (rawMode && rawMode !== 'test' && rawMode !== 'live') {
        throw new Error('PAYMENTS_ENV_MODE must be either "test" or "live".');
    }

    const configuredModes = new Set<PaymentsEnvMode>();
    const keyFields: Array<keyof NodeJS.ProcessEnv> = [
        'PAYSTACK_SECRET_KEY',
        'PAYSTACK_PUBLIC_KEY',
        'STRIPE_SECRET_KEY',
        'STRIPE_PUBLISHABLE_KEY',
    ];

    for (const keyField of keyFields) {
        const inferredMode = inferKeyMode(env[keyField]);
        if (inferredMode) {
            configuredModes.add(inferredMode);
        }
    }

    if (configuredModes.size > 1) {
        throw new Error(
            'Mixed test/live provider keys detected. Configure keys for only one mode.'
        );
    }

    const inferredMode = configuredModes.values().next().value as PaymentsEnvMode | undefined;
    const effectiveMode = (rawMode as PaymentsEnvMode | undefined) || inferredMode || 'test';

    if (rawMode && inferredMode && rawMode !== inferredMode) {
        throw new Error(
            `PAYMENTS_ENV_MODE=${rawMode} does not match configured provider keys (${inferredMode}).`
        );
    }

    return {
        mode: effectiveMode,
        escrow: resolveEscrowPolicy(env),
    };
};
