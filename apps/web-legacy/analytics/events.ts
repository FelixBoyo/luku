import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

/**
 * Core analytics event names for LUKU.
 *
 * These are intentionally generic and stable – avoid renaming lightly.
 */
export type AnalyticsEventName =
    // Authentication & identity
    | 'user_signed_up'
    | 'user_logged_in'
    // Styling & wardrobe
    | 'wardrobe_item_added'
    | 'outfit_generated'
    | 'outfit_saved'
    | 'style_analysis_completed'
    | 'trip_plan_generated'
    // Discovery & engagement
    | 'discover_tab_opened'
    | 'discover_card_interacted'
    // Marketplace (buyer)
    | 'product_viewed'
    | 'product_added_to_cart'
    | 'checkout_started'
    | 'order_completed'
    | 'product_added_to_wishlist'
    | 'return_requested'
    // Marketplace (seller)
    | 'business_account_created'
    | 'kyc_step_completed'
    | 'product_listed'
    | 'promotion_created'
    // Additional recommended events
    | 'search_performed'
    | 'filter_applied'
    | 'review_submitted';

/**
 * Strongly typed event payloads keyed by event name.
 * These should mirror the high-level schema described in the analytics plan.
 */
export interface AnalyticsEventPayloads {
    // Authentication & identity
    user_signed_up: {
        channel?: string | null;
        referralCode?: string | null;
        hasBusinessIntent?: boolean;
    };
    user_logged_in: {
        method?: 'password' | 'oauth' | 'magic_link' | string;
        deviceType?: 'desktop' | 'mobile' | 'tablet' | string;
    };

    // Styling & wardrobe
    wardrobe_item_added: {
        category: string;
        color: string;
        styleTags?: string[];
        hasImage?: boolean;
    };
    outfit_generated: {
        sourceScreen: string;
        itemCount: number;
        hasCustomPrompt?: boolean;
    };
    outfit_saved: {
        albumId?: string | null;
        isFirstOutfit?: boolean;
    };
    style_analysis_completed: {
        hasStyleDnaSaved?: boolean;
    };
    trip_plan_generated: {
        destinationType?: string | null;
        tripDurationDays?: number | null;
    };

    // Discovery & engagement
    discover_tab_opened: {
        entryPoint?: string | null;
        userTenureDays?: number | null;
    };
    discover_card_interacted: {
        cardType: 'suggestion' | 'trend' | 'style_analysis' | string;
        actionType: 'click' | 'save' | 'share' | string;
    };

    // Marketplace (buyer)
    product_viewed: {
        productId: string;
        category: string;
        priceBucket?: 'low' | 'medium' | 'high' | string;
        sellerId: string;
    };
    product_added_to_cart: {
        productId: string;
        quantity: number;
        price: number;
        sourceScreen?: string;
    };
    checkout_started: {
        cartValue: number;
        itemCount: number;
    };
    order_completed: {
        orderId: string;
        totalValue: number;
        itemCount: number;
        hasWardrobeHistory?: boolean;
    };
    product_added_to_wishlist: {
        productId: string;
    };
    return_requested: {
        orderId: string;
        productId: string;
        reasonCategory?: string | null;
    };

    // Marketplace (seller)
    business_account_created: {
        businessType?: string | null;
    };
    kyc_step_completed: {
        personaType: 'personal' | 'business';
        stepName: string;
    };
    product_listed: {
        productId: string;
        category: string;
        price: number;
        initialStock: number;
    };
    promotion_created: {
        promotionType: 'discount' | 'bundle' | 'flash_sale' | string;
        discountType?: 'percentage' | 'amount' | string;
        discountValue?: number | null;
    };

    // Additional recommended events
    search_performed: {
        query: string;
        filtersApplied?: string[];
        resultsCount?: number;
    };
    filter_applied: {
        filterType: string;
        filterValue: string;
    };
    review_submitted: {
        productId: string;
        rating: number;
        hasText?: boolean;
    };
}

export type AnalyticsEventPayload<K extends AnalyticsEventName> =
    AnalyticsEventPayloads[K] & Record<string, unknown>;

export interface TrackEventOptions {
    /**
     * Explicit user id, if already known at call site.
     * If omitted, the tracker will attempt to read the current Supabase user.
     */
    userId?: string | null;
    /**
     * Optional session identifier. If omitted, a stable session id for
     * this browser session will be generated and reused.
     */
    sessionId?: string;
    /**
     * Optional override for event timestamp.
     */
    occurredAt?: string;
}

/**
 * Simple in-memory + sessionStorage backed session id helper.
 */
let cachedSessionId: string | null = null;

function getOrCreateSessionId(): string {
    if (cachedSessionId) return cachedSessionId;

    if (typeof window === 'undefined') {
        cachedSessionId = `server-${Date.now()}`;
        return cachedSessionId;
    }

    const KEY = 'luku_analytics_session_id';
    const existing =
        window.sessionStorage?.getItem(KEY) ||
        window.localStorage?.getItem(KEY);

    if (existing) {
        cachedSessionId = existing;
        return existing;
    }

    const newId = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    cachedSessionId = newId;

    try {
        window.sessionStorage?.setItem(KEY, newId);
    } catch {
        // ignore storage failures
    }

    return newId;
}

/**
 * Core tracking function used throughout the app.
 *
 * - Persists events to Supabase `events` table when configured.
 * - Optionally forwards to third-party tools if present on window.
 */
export async function trackEvent<K extends AnalyticsEventName>(
    name: K,
    payload: AnalyticsEventPayload<K>,
    options: TrackEventOptions = {}
): Promise<void> {
    if (typeof window === 'undefined') {
        // Avoid tracking during SSR or tests that run in Node by default.
        return;
    }

    const occurredAt =
        options.occurredAt || new Date().toISOString();

    // Attempt to resolve user id if not provided
    let userId = options.userId ?? null;
    try {
        if (!userId) {
            const { data, error } = await supabase.auth.getUser();
            if (!error && data?.user) {
                userId = data.user.id;
            }
        }
    } catch {
        // Non-fatal; we can still track anonymous events
    }

    const sessionId = options.sessionId || getOrCreateSessionId();

    const eventRecord = {
        event_name: name,
        user_id: userId,
        session_id: sessionId,
        occurred_at: occurredAt,
        properties: payload,
    };

    // 1) Persist to Supabase events table (if configured)
    if (isSupabaseConfigured) {
        try {
            const { error } = await supabase
                .from('events')
                .insert(eventRecord);

            if (error) {
                // Avoid throwing – tracking failures shouldn't break UX
                if (import.meta.env.DEV) {
                    console.warn('[analytics] Failed to insert event', {
                        name,
                        error: error.message,
                    });
                }
            }
        } catch (err) {
            if (import.meta.env.DEV) {
                console.warn('[analytics] Error sending event', name, err);
            }
        }
    } else if (import.meta.env.DEV) {
        // Helpful during local development when Supabase is not configured
        // eslint-disable-next-line no-console
        console.debug('[analytics] Event (dev, not sent to Supabase):', {
            name,
            eventRecord,
        });
    }

    // 2) Optional: forward to third-party analytics if present
    const anyWindow = window as any;

    try {
        if (typeof anyWindow.gtag === 'function') {
            anyWindow.gtag('event', name, {
                ...payload,
                event_category: 'engagement',
                event_label: name,
            });
        }
    } catch {
        // Ignore third-party errors
    }

    try {
        if (anyWindow.analytics && typeof anyWindow.analytics.track === 'function') {
            anyWindow.analytics.track(name, {
                ...payload,
                userId: userId ?? undefined,
                sessionId,
                occurredAt,
            });
        }
    } catch {
        // Ignore third-party errors
    }
}

