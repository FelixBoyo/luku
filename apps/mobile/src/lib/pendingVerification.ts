import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'luku_pending_verification';

/** Align with Supabase OTP expiry (see docs/ops/supabase-email-otp.md). */
export const PENDING_VERIFICATION_TTL_MS = 600_000;

export type PendingVerification = {
    email: string;
    startedAt: number;
};

export const setPendingVerification = async (email: string): Promise<void> => {
    const payload: PendingVerification = {
        email: email.trim(),
        startedAt: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const clearPendingVerification = async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEY);
};

export const getActivePendingVerification = async (): Promise<PendingVerification | null> => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as PendingVerification;
        if (!parsed.email || !parsed.startedAt) {
            await clearPendingVerification();
            return null;
        }
        if (Date.now() - parsed.startedAt > PENDING_VERIFICATION_TTL_MS) {
            await clearPendingVerification();
            return null;
        }
        return parsed;
    } catch {
        await clearPendingVerification();
        return null;
    }
};
