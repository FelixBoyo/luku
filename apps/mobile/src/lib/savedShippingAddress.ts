import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Checkout's shipping form used to start empty every time — "123 Kimathi
 * Street" is only the input's placeholder hint, not a real default, but a
 * returning buyer had to retype their real address on every order. This
 * remembers the last address a buyer actually submitted, on-device, keyed
 * by user id, so checkout can pre-fill the form with it next time.
 */
export type SavedShippingAddress = {
    name: string;
    street: string;
    city: string;
    postal: string;
    phone: string;
};

const STORAGE_KEY_PREFIX = 'luku.savedShippingAddress.';

const keyFor = (userId: string): string => `${STORAGE_KEY_PREFIX}${userId}`;

const isSavedShippingAddress = (value: unknown): value is SavedShippingAddress => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const record = value as Record<string, unknown>;
    return (
        typeof record.name === 'string' &&
        typeof record.street === 'string' &&
        typeof record.city === 'string' &&
        typeof record.postal === 'string' &&
        typeof record.phone === 'string'
    );
};

/** Returns the buyer's last-used address, or `null` if none was saved / storage failed. */
export const loadSavedShippingAddress = async (
    userId: string,
): Promise<SavedShippingAddress | null> => {
    try {
        const raw = await AsyncStorage.getItem(keyFor(userId));
        if (!raw) {
            return null;
        }
        const parsed: unknown = JSON.parse(raw);
        return isSavedShippingAddress(parsed) ? parsed : null;
    } catch {
        return null;
    }
};

/** Best-effort — checkout must proceed even if local persistence fails. */
export const saveShippingAddress = async (
    userId: string,
    address: SavedShippingAddress,
): Promise<void> => {
    try {
        await AsyncStorage.setItem(keyFor(userId), JSON.stringify(address));
    } catch {
        // ignore
    }
};
