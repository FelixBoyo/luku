/**
 * POST   /api/payments/paystack/recipients
 * GET    /api/payments/paystack/recipients/me
 * DELETE /api/payments/paystack/recipients/:id
 *
 * Registers a seller's payout destination (bank account or M-Pesa number) as
 * a Paystack Transfer Recipient. The returned recipient_code is what
 * C-CORE-4's payout handler targets when an order reaches `released`.
 *
 * Reference: https://paystack.com/docs/api/transfer-recipient
 */

import { safeLogger } from '../../../http/redact';
import { readPaystackJson } from '../../../payments/paystackResponse';
import {
    getPayoutDetails,
    savePayoutDetails,
    deletePayoutDetails,
} from '../../../services/payoutDetailsService';

export interface CreateRecipientRequest {
    type: 'nuban' | 'mobile_money';
    accountName: string;
    // nuban (bank) fields
    bankCode?: string;
    accountNumber?: string;
    // mobile_money fields
    phoneNumber?: string;
}

export interface SavedRecipient {
    id: string;
    type: 'nuban' | 'mobile_money';
    label: string;
    accountName: string;
    recipientCode: string;
}

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const maskAccount = (value: string) =>
    value.length > 4 ? `•••• ${value.slice(-4)}` : value;

/**
 * Creates (or replaces) the calling seller's Transfer Recipient with Paystack,
 * then persists the recipient_code against sellerId via payoutDetailsService.
 * v1: one recipient per seller — a repeat call replaces the previous one.
 */
export const createTransferRecipient = async (
    sellerId: string,
    payload: CreateRecipientRequest,
): Promise<SavedRecipient> => {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
        throw new Error('Paystack secret key is not configured');
    }

    const { type, accountName } = payload;

    if (!accountName || accountName.trim().length < 2) {
        throw new Error('Account name is required.');
    }

    if (type === 'nuban') {
        if (!payload.bankCode) {
            throw new Error('Bank is required.');
        }
        if (!payload.accountNumber || payload.accountNumber.length < 6) {
            throw new Error('A valid account number is required.');
        }
    } else if (type === 'mobile_money') {
        if (!payload.phoneNumber || !/^(?:\+?254|0)7\d{8}$/.test(payload.phoneNumber)) {
            throw new Error('A valid M-Pesa phone number is required.');
        }
    } else {
        throw new Error('Unsupported recipient type.');
    }

    const body =
        type === 'nuban'
            ? {
                  type: 'nuban',
                  name: accountName.trim(),
                  account_number: payload.accountNumber,
                  bank_code: payload.bankCode,
                  currency: 'KES',
              }
            : {
                  type: 'mobile_money',
                  name: accountName.trim(),
                  account_number: payload.phoneNumber,
                  bank_code: 'MPESA',
                  currency: 'KES',
              };

    try {
        const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await readPaystackJson<unknown>(response);
            const errorMessage =
                errorData.message || `Paystack API returned ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await readPaystackJson<{
            recipient_code?: string;
            details?: { account_number?: string };
        }>(response);

        const recipientCode = data.data?.recipient_code;
        if (!recipientCode) {
            throw new Error('Paystack response did not include a recipient code');
        }

        const rawAccount =
            type === 'nuban' ? payload.accountNumber! : payload.phoneNumber!;
        const label =
            type === 'nuban'
                ? `Bank account ${maskAccount(rawAccount)}`
                : `M-Pesa ${maskAccount(rawAccount)}`;

        const saved = await savePayoutDetails(sellerId, {
            type,
            label,
            accountName: accountName.trim(),
            recipientCode,
        });

        return {
            id: saved.id,
            type: saved.type,
            label: saved.label,
            accountName: saved.accountName,
            recipientCode: saved.recipientCode,
        };
    } catch (error: any) {
        safeLogger.error('Paystack transfer recipient error', { error, sellerId });

        let errorMessage = 'There was a problem saving your payout details.';
        if (error.message?.includes('account')) {
            errorMessage = 'That account could not be verified. Double-check the details and try again.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        throw new Error(errorMessage);
    }
};

/**
 * Reads the stored recipient (if any) for the calling seller. Local read
 * only — does not call Paystack.
 */
export const getMyTransferRecipient = async (
    sellerId: string,
): Promise<SavedRecipient | null> => {
    const existing = await getPayoutDetails(sellerId);
    if (!existing) {
        return null;
    }
    return {
        id: existing.id,
        type: existing.type,
        label: existing.label,
        accountName: existing.accountName,
        recipientCode: existing.recipientCode,
    };
};

/**
 * Deletes the seller's saved payout recipient locally. Does NOT currently
 * deactivate the recipient on Paystack's side (DELETE /transferrecipient/:code)
 * — worth confirming with the team whether that's required for v1
 * (compliance/audit) or local-only removal is enough. recipientId is accepted
 * for API-shape symmetry (DELETE /recipients/:id) but v1 storage is one
 * recipient per seller, so it isn't currently used to disambiguate.
 */
export const deleteTransferRecipient = async (
    sellerId: string,
    recipientId: string,
): Promise<void> => {
    void recipientId;
    await deletePayoutDetails(sellerId);
};