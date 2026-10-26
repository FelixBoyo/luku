import { describe, expect, it, vi, beforeEach } from 'vitest';

const store = new Map<string, string>();
const getItem = vi.fn(async (key: string) => store.get(key) ?? null);
const setItem = vi.fn(async (key: string, value: string) => {
    store.set(key, value);
});

vi.mock('@react-native-async-storage/async-storage', () => ({
    default: {
        getItem: (...args: [string]) => getItem(...args),
        setItem: (...args: [string, string]) => setItem(...args),
    },
}));

import { loadSavedShippingAddress, saveShippingAddress } from '../src/lib/savedShippingAddress';

const address = {
    name: 'Jane Doe',
    street: '123 Kimathi Street',
    city: 'Nairobi',
    postal: '00100',
    phone: '0712345678',
};

describe('savedShippingAddress', () => {
    beforeEach(() => {
        store.clear();
        vi.clearAllMocks();
    });

    it('returns null when nothing is saved for the user', async () => {
        await expect(loadSavedShippingAddress('user-1')).resolves.toBeNull();
    });

    it('round-trips a saved address, keyed by user id', async () => {
        await saveShippingAddress('user-1', address);

        await expect(loadSavedShippingAddress('user-1')).resolves.toEqual(address);
        // A different user never sees another buyer's address.
        await expect(loadSavedShippingAddress('user-2')).resolves.toBeNull();
    });

    it('returns null instead of throwing on corrupt storage', async () => {
        store.set('luku.savedShippingAddress.user-1', '{not json');
        await expect(loadSavedShippingAddress('user-1')).resolves.toBeNull();
    });

    it('returns null for a stored value missing required fields', async () => {
        store.set('luku.savedShippingAddress.user-1', JSON.stringify({ name: 'Jane Doe' }));
        await expect(loadSavedShippingAddress('user-1')).resolves.toBeNull();
    });

    it('does not throw when the storage write itself fails', async () => {
        setItem.mockRejectedValueOnce(new Error('disk full'));
        await expect(saveShippingAddress('user-1', address)).resolves.toBeUndefined();
    });
});
