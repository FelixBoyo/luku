import { getSupabaseAdmin } from '../data/supabaseAdmin';

export type PayoutRecipientType = 'nuban' | 'mobile_money';

export interface SellerPayoutDetails {
    id: string;
    sellerId: string;
    type: PayoutRecipientType;
    label: string;
    accountName: string;
    recipientCode: string;
    createdAt: string;
}

const mapRow = (row: any): SellerPayoutDetails => ({
    id: String(row.id),
    sellerId: String(row.seller_id),
    type: row.type,
    label: String(row.label),
    accountName: String(row.account_name),
    recipientCode: String(row.recipient_code),
    createdAt: String(row.created_at),
});

/**
 * Returns the seller's currently saved payout recipient, or null if they
 * haven't set one up yet. v1 supports a single recipient per seller.
 */
export const getPayoutDetails = async (
    sellerId: string,
): Promise<SellerPayoutDetails | null> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('seller_payout_details')
        .select('*')
        .eq('seller_id', sellerId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return data ? mapRow(data) : null;
};

export const PAYOUT_DETAILS_REQUIRED_CODE = 'PAYOUT_DETAILS_REQUIRED' as const;

export class PayoutDetailsRequiredError extends Error {
    readonly code = PAYOUT_DETAILS_REQUIRED_CODE;

    constructor(message = 'Add payout details before marking an order as shipped.') {
        super(message);
        this.name = 'PayoutDetailsRequiredError';
    }
}

/**
 * Persists a newly created Paystack recipient for a seller. If one already
 * exists for this seller, it's replaced (v1: one recipient per seller) —
 * upsert on seller_id keeps this a single call rather than delete-then-insert.
 */
export const savePayoutDetails = async (
    sellerId: string,
    details: {
        type: PayoutRecipientType;
        label: string;
        accountName: string;
        recipientCode: string;
    },
): Promise<SellerPayoutDetails> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('seller_payout_details')
        .upsert(
            {
                seller_id: sellerId,
                type: details.type,
                label: details.label,
                account_name: details.accountName,
                recipient_code: details.recipientCode,
            },
            { onConflict: 'seller_id' },
        )
        .select('*')
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return mapRow(data);
};

/**
 * Removes the seller's saved payout recipient locally. Does not deactivate
 * the recipient on Paystack's side — worth confirming with the team whether
 * that's required for v1 (compliance/audit) or local-only removal is enough.
 */
export const deletePayoutDetails = async (sellerId: string): Promise<void> => {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('seller_payout_details')
        .delete()
        .eq('seller_id', sellerId);

    if (error) {
        throw new Error(error.message);
    }
};