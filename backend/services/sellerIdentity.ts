/**
 * Resolves an order's seller to the `auth.users` id that payout details are
 * keyed by.
 *
 * `orders` (012) carries two mutually exclusive seller columns:
 *   - `seller_user_id` -> auth.users.id        (peer listing sale)
 *   - `seller_id`      -> business_accounts.id (catalog sale)
 *
 * `seller_payout_details.seller_id` references `auth.users`, because that is
 * the only id an RLS policy can compare against `auth.uid()`, and because the
 * recipient handler stores against `req.userId`. So a catalog order needs the
 * extra hop through `business_accounts.user_id` before its payout destination
 * can be looked up.
 *
 * Without this, `getPayoutDetails(order.seller_id)` returns null for every
 * business seller and payout fails with "no payout details on file" even
 * though the seller registered them. Peer sales would work, which is what
 * makes the bug easy to miss.
 */

import { getSupabaseAdmin } from '../data/supabaseAdmin';

export class SellerIdentityNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SellerIdentityNotFoundError';
    }
}

export type OrderSellerColumns = {
    seller_id?: string | null;
    seller_user_id?: string | null;
};

/**
 * Returns the seller's `auth.users` id. Pass this to `getPayoutDetails` and
 * `payoutOnRelease`, never `orders.seller_id` directly.
 */
export const resolveSellerUserId = async (order: OrderSellerColumns): Promise<string> => {
    if (order.seller_user_id) {
        return order.seller_user_id;
    }

    if (!order.seller_id) {
        throw new SellerIdentityNotFoundError(
            'Order has neither seller_user_id nor seller_id; cannot resolve a payout destination.'
        );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('business_accounts')
        .select('user_id')
        .eq('id', order.seller_id)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    if (!data?.user_id) {
        throw new SellerIdentityNotFoundError(
            `Business account "${order.seller_id}" has no owning user; cannot resolve a payout destination.`
        );
    }

    return String(data.user_id);
};
