/**
 * Paystack Verify Transaction + Charge GET helpers for reconciliation (C-CORE-6a).
 * Provider Verify is authoritative for amount and terminal status.
 */

import { readPaystackJson } from './paystackResponse';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export type PaystackVerifyStatus =
    | 'success'
    | 'failed'
    | 'abandoned'
    | 'pending'
    | 'reversed'
    | string;

export type PaystackVerifyResult = {
    reference: string;
    status: PaystackVerifyStatus;
    amountMinor: number;
    currency: string;
    channel?: string;
    paidAt?: string;
    raw: unknown;
};

type PaystackTransactionData = {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    channel?: string;
    paid_at?: string;
    gateway_response?: string;
};

type PaystackChargeData = {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    channel?: string;
    paid_at?: string;
};

const normalizeStatus = (status: string | undefined): PaystackVerifyStatus => {
    const raw = (status ?? 'pending').toLowerCase();
    if (raw === 'success' || raw === 'failed' || raw === 'abandoned' || raw === 'pending' || raw === 'reversed') {
        return raw;
    }
    // Charge API interim states are still pending for reconciliation purposes.
    if (
        raw === 'send_otp' ||
        raw === 'send_pin' ||
        raw === 'send_phone' ||
        raw === 'send_birthday' ||
        raw === 'open_url' ||
        raw === 'pay_offline' ||
        raw === 'ongoing'
    ) {
        return 'pending';
    }
    return raw;
};

const mapTransactionData = (
    reference: string,
    data: PaystackTransactionData | PaystackChargeData | undefined,
    raw: unknown
): PaystackVerifyResult => ({
    reference: String(data?.reference ?? reference),
    status: normalizeStatus(data?.status),
    amountMinor: Number(data?.amount ?? 0),
    currency: String(data?.currency ?? 'KES'),
    channel: data?.channel ? String(data.channel) : undefined,
    paidAt: data?.paid_at ? String(data.paid_at) : undefined,
    raw,
});

const getSecretKey = (): string => {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) {
        throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }
    return key;
};

/**
 * GET /transaction/verify/:reference — preferred path for card + settled M-Pesa refs.
 */
export const verifyPaystackTransaction = async (
    reference: string,
    fetchImpl: typeof fetch = fetch
): Promise<PaystackVerifyResult> => {
    const secret = getSecretKey();
    const response = await fetchImpl(
        `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${secret}`,
                Accept: 'application/json',
            },
        }
    );

    const envelope = await readPaystackJson<PaystackTransactionData>(response);
    if (!response.ok) {
        throw new Error(
            envelope.message || `Paystack verify failed (${response.status})`
        );
    }

    return mapTransactionData(reference, envelope.data, envelope);
};

/**
 * GET /charge/:reference — fallback for in-flight M-Pesa charge refs that Verify may not know yet.
 */
export const fetchPaystackCharge = async (
    reference: string,
    fetchImpl: typeof fetch = fetch
): Promise<PaystackVerifyResult> => {
    const secret = getSecretKey();
    const response = await fetchImpl(
        `${PAYSTACK_BASE_URL}/charge/${encodeURIComponent(reference)}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${secret}`,
                Accept: 'application/json',
            },
        }
    );

    const envelope = await readPaystackJson<PaystackChargeData>(response);
    if (!response.ok) {
        throw new Error(
            envelope.message || `Paystack charge lookup failed (${response.status})`
        );
    }

    return mapTransactionData(reference, envelope.data, envelope);
};

/**
 * Prefer Verify; on hard failure try Charge GET (M-Pesa STK refs).
 */
export const resolvePaystackPayment = async (
    reference: string,
    fetchImpl: typeof fetch = fetch
): Promise<PaystackVerifyResult> => {
    try {
        return await verifyPaystackTransaction(reference, fetchImpl);
    } catch (verifyError) {
        try {
            return await fetchPaystackCharge(reference, fetchImpl);
        } catch {
            throw verifyError;
        }
    }
};
