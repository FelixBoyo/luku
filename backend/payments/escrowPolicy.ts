/**
 * Canonical escrow policy values (ADR-11 — docs/architecture/ESCROW_POLICY.md).
 *
 * Every consumer reads from here: the state machine (C-CORE-2), payout math
 * (C-CORE-4), and the timer jobs (C-CORE-7). No inline 7 / 3 / 0.10 anywhere.
 * Changing a window or the rate is an env edit plus a restart, not a code change.
 */

import { VAT_RATE } from '../../packages/contracts/src/pricing';

export interface EscrowPolicy {
    /** D2 — days after shipped/delivered before funds auto-release to the seller. */
    autoReleaseDays: number;
    /** D3 — days after paid the seller has to mark shipped before auto-cancel. */
    shipByDays: number;
    /** D7 — platform commission as a fraction of item price, taken at release. */
    commissionRate: number;
    /**
     * D12 — VAT as a fraction of the item subtotal. Part of what the buyer is
     * charged and therefore part of the escrowed amount, but never part of the
     * payout base: the seller is not paid on tax the platform remits.
     */
    vatRate: number;
    /** D10 — days after shipped to nudge the buyer to confirm receipt. */
    buyerReminderDays: number[];
    /** D10 — days after paid to nudge the seller to ship. */
    sellerReminderDays: number[];
}

export const ESCROW_POLICY_DEFAULTS: EscrowPolicy = {
    autoReleaseDays: 7,
    shipByDays: 3,
    commissionRate: 0.1,
    vatRate: VAT_RATE,
    buyerReminderDays: [3, 6],
    sellerReminderDays: [2],
};

export class EscrowPolicyConfigError extends Error {}

const parsePositiveInteger = (
    raw: string | undefined,
    field: string,
    fallback: number
): number => {
    if (raw === undefined || raw.trim() === '') {
        return fallback;
    }

    const value = Number(raw);

    if (!Number.isInteger(value)) {
        throw new EscrowPolicyConfigError(`${field} must be an integer. Received "${raw}".`);
    }

    if (value <= 0) {
        throw new EscrowPolicyConfigError(`${field} must be greater than 0. Received ${value}.`);
    }

    return value;
};

/** A fraction in [0, 1) — commission and VAT are both expressed this way. */
const parseRate = (raw: string | undefined, field: string, fallback: number): number => {
    if (raw === undefined || raw.trim() === '') {
        return fallback;
    }

    const value = Number(raw);

    if (!Number.isFinite(value)) {
        throw new EscrowPolicyConfigError(`${field} must be a number. Received "${raw}".`);
    }

    if (value < 0 || value >= 1) {
        throw new EscrowPolicyConfigError(
            `${field} must be between 0 (inclusive) and 1 (exclusive). Received ${value}.`
        );
    }

    return value;
};

const parseDayList = (
    raw: string | undefined,
    field: string,
    fallback: number[]
): number[] => {
    if (raw === undefined || raw.trim() === '') {
        return [...fallback];
    }

    const parts = raw
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0);

    if (parts.length === 0) {
        return [];
    }

    const days = parts.map((part) => {
        const value = Number(part);

        if (!Number.isInteger(value) || value <= 0) {
            throw new EscrowPolicyConfigError(
                `${field} must be a comma-separated list of positive integers. Received "${raw}".`
            );
        }

        return value;
    });

    return Array.from(new Set(days)).sort((a, b) => a - b);
};

export const resolveEscrowPolicy = (env: NodeJS.ProcessEnv): EscrowPolicy => {
    const shipByDays = parsePositiveInteger(
        env.ESCROW_SHIP_BY_DAYS,
        'ESCROW_SHIP_BY_DAYS',
        ESCROW_POLICY_DEFAULTS.shipByDays
    );

    const autoReleaseDays = parsePositiveInteger(
        env.ESCROW_AUTO_RELEASE_DAYS,
        'ESCROW_AUTO_RELEASE_DAYS',
        ESCROW_POLICY_DEFAULTS.autoReleaseDays
    );

    if (autoReleaseDays <= shipByDays) {
        throw new EscrowPolicyConfigError(
            `ESCROW_AUTO_RELEASE_DAYS (${autoReleaseDays}) must be greater than ESCROW_SHIP_BY_DAYS (${shipByDays}).`
        );
    }

    const commissionRate = parseRate(
        env.ESCROW_COMMISSION_RATE,
        'ESCROW_COMMISSION_RATE',
        ESCROW_POLICY_DEFAULTS.commissionRate
    );

    const vatRate = parseRate(env.ESCROW_VAT_RATE, 'ESCROW_VAT_RATE', ESCROW_POLICY_DEFAULTS.vatRate);

    const buyerReminderDays = parseDayList(
        env.ESCROW_BUYER_REMINDER_DAYS,
        'ESCROW_BUYER_REMINDER_DAYS',
        ESCROW_POLICY_DEFAULTS.buyerReminderDays
    );

    const sellerReminderDays = parseDayList(
        env.ESCROW_SELLER_REMINDER_DAYS,
        'ESCROW_SELLER_REMINDER_DAYS',
        ESCROW_POLICY_DEFAULTS.sellerReminderDays
    );

    const lateBuyerReminder = buyerReminderDays.find((day) => day >= autoReleaseDays);
    if (lateBuyerReminder !== undefined) {
        throw new EscrowPolicyConfigError(
            `ESCROW_BUYER_REMINDER_DAYS contains ${lateBuyerReminder}, which is not before ESCROW_AUTO_RELEASE_DAYS (${autoReleaseDays}).`
        );
    }

    const lateSellerReminder = sellerReminderDays.find((day) => day >= shipByDays);
    if (lateSellerReminder !== undefined) {
        throw new EscrowPolicyConfigError(
            `ESCROW_SELLER_REMINDER_DAYS contains ${lateSellerReminder}, which is not before ESCROW_SHIP_BY_DAYS (${shipByDays}).`
        );
    }

    return {
        autoReleaseDays,
        shipByDays,
        commissionRate,
        vatRate,
        buyerReminderDays,
        sellerReminderDays,
    };
};

let cached: EscrowPolicy | null = null;

export const getEscrowPolicy = (): EscrowPolicy => {
    if (!cached) {
        cached = resolveEscrowPolicy(process.env);
    }

    return cached;
};

/** Test-only: forces the next getEscrowPolicy() call to re-read the environment. */
export const resetEscrowPolicyCache = (): void => {
    cached = null;
};

/**
 * Accessors are lazy so importing this module never reads the environment before
 * dotenv has run.
 */
export const escrowPolicy: EscrowPolicy = {
    get autoReleaseDays() {
        return getEscrowPolicy().autoReleaseDays;
    },
    get shipByDays() {
        return getEscrowPolicy().shipByDays;
    },
    get commissionRate() {
        return getEscrowPolicy().commissionRate;
    },
    get vatRate() {
        return getEscrowPolicy().vatRate;
    },
    get buyerReminderDays() {
        return getEscrowPolicy().buyerReminderDays;
    },
    get sellerReminderDays() {
        return getEscrowPolicy().sellerReminderDays;
    },
};
