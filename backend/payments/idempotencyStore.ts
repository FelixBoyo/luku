import { getSupabaseAdmin } from '../data/supabaseAdmin';

export interface IdempotencyRecord {
    provider: string;
    reference: string;
    eventType?: string;
    processedAt: string;
}

export interface IdempotencyStore {
    hasProcessed(key: string): Promise<boolean>;
    markProcessed(key: string, record: IdempotencyRecord): Promise<void>;
}

/**
 * C-CORE-3: backed by `processed_webhook_events` (C-CORE-1) so a restart or a
 * redeploy cannot forget which events were already applied — the in-memory
 * store this replaces lost that history on every process restart.
 */
export class DbIdempotencyStore implements IdempotencyStore {
    async hasProcessed(key: string): Promise<boolean> {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('processed_webhook_events')
            .select('key')
            .eq('key', key)
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }

        return Boolean(data);
    }

    async markProcessed(key: string, record: IdempotencyRecord): Promise<void> {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase.from('processed_webhook_events').insert({
            key,
            provider: record.provider,
            reference: record.reference,
            event_type: record.eventType ?? null,
            processed_at: record.processedAt,
        });

        // Two concurrent deliveries can both pass hasProcessed() before either
        // inserts. The loser hits the primary-key conflict — that's exactly the
        // "someone else already recorded this" outcome we want, not a failure.
        if (error && error.code !== '23505') {
            throw new Error(error.message);
        }
    }
}

export const webhookIdempotencyStore: IdempotencyStore = new DbIdempotencyStore();

/**
 * `charge.success` keeps the historical `provider:reference` shape so rows
 * already in `processed_webhook_events` still dedupe. Other event types
 * include the event name so a later `refund.processed` on the same
 * reference is not dropped as a duplicate of the charge.
 */
export const buildWebhookIdempotencyKey = (
    provider: string,
    reference: string,
    eventType?: string
): string => {
    if (!eventType || eventType === 'charge.success') {
        return `${provider}:${reference}`;
    }
    return `${provider}:${eventType}:${reference}`;
};
