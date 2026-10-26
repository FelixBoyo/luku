/**
 * Centralized Configuration for Third-Party Integrations
 * Manages API keys, endpoints, and service settings
 */

export interface IntegrationConfig {
    stripe: {
        publishableKey: string;
        apiVersion: string;
        enabled: boolean;
    };
    supabase: {
        projectId: string;
        anonKey: string;
        enabled: boolean;
    };
    gemini: {
        apiKey: string;
        enabled: boolean;
        defaultModel: string;
        fallbackModel?: string;
    };
    mpesa: {
        apiKey: string;
        shortCode: string;
        passKey: string;
        environment: 'sandbox' | 'production';
        enabled: boolean;
    };
    paystack?: {
        publicKey: string;
        enabled: boolean;
    };
}

/**
 * Get integration configuration from environment variables
 */
export const getIntegrationConfig = (): IntegrationConfig => {
    const config: IntegrationConfig = {
        stripe: {
            publishableKey:
                (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || '',
            apiVersion: '2024-11-20.acacia',
            enabled: !!(import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY,
        },
        supabase: {
            projectId: (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID || '',
            anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '',
            enabled: !!(import.meta as any).env?.VITE_SUPABASE_PROJECT_ID,
        },
        gemini: {
            // Gemini calls are proxied through backend endpoints;
            // keep secrets server-side and out of browser bundle.
            apiKey: '',
            enabled: (import.meta as any).env?.VITE_ENABLE_GEMINI !== 'false',
            defaultModel: 'gemini-2.5-flash',
            fallbackModel: 'gemini-2.0-flash-exp',
        },
        mpesa: {
            apiKey: '',
            shortCode: '',
            passKey: '',
            environment:
                ((import.meta as any).env?.VITE_MPESA_ENVIRONMENT as
                    | 'sandbox'
                    | 'production') || 'sandbox',
            enabled: (import.meta as any).env?.VITE_PAYSTACK_ENABLE_MPESA === 'true',
        },
    };

    return config;
};

/**
 * Validate that required integrations are configured
 */
export const validateIntegrationConfig = (
    config: IntegrationConfig
): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!config.supabase.enabled) {
        errors.push('Supabase is not configured');
    }

    if (!config.gemini.enabled) {
        errors.push('Gemini API is not configured');
    }

    // M-Pesa is optional and may be region-specific
    if (!config.mpesa.enabled) {
        console.warn(
            'M-Pesa is not configured - mobile money payment features will be unavailable'
        );
    }

    // Stripe is optional for development
    if (!config.stripe.enabled) {
        console.warn('Stripe is not configured - payment features will be limited');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

/**
 * Get service status for monitoring
 */
export const getServiceStatus = (config: IntegrationConfig) => {
    return {
        stripe: {
            enabled: config.stripe.enabled,
            configured: !!config.stripe.publishableKey,
        },
        supabase: {
            enabled: config.supabase.enabled,
            configured: !!config.supabase.projectId && !!config.supabase.anonKey,
        },
        gemini: {
            enabled: config.gemini.enabled,
            configured: config.gemini.enabled,
        },
        mpesa: {
            enabled: config.mpesa.enabled,
            configured:
                !!config.mpesa.apiKey &&
                !!config.mpesa.shortCode &&
                !!config.mpesa.passKey,
        },
        paystack: {
            enabled: config.paystack?.enabled || false,
            configured: !!config.paystack?.publicKey,
        },
    };
};
