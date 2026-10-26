import { apiGet } from '../api/apiClient';

/**
 * True when the signed-in seller already has a payout recipient on file.
 * Network errors return true so listing confirmation is not blocked.
 */
export const sellerHasPayoutDetails = async (): Promise<boolean> => {
    try {
        const res = await apiGet<{ recipient: { id: string } | null }>(
            '/v1/api/payments/paystack/recipients/me',
        );
        return Boolean(res.data?.recipient);
    } catch {
        return true;
    }
};
