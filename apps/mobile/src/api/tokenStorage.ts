import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'luku_access_token';
const REFRESH_KEY = 'luku_refresh_token';
const MIGRATED_KEY = 'luku_tokens_migrated_secure';

const secureAvailable = async (): Promise<boolean> => {
    try {
        return await SecureStore.isAvailableAsync();
    } catch {
        return false;
    }
};

const migrateFromAsyncStorage = async (): Promise<void> => {
    if (!(await secureAvailable())) return;
    const migrated = await AsyncStorage.getItem(MIGRATED_KEY);
    if (migrated === 'true') return;

    const access = await AsyncStorage.getItem(ACCESS_KEY);
    const refresh = await AsyncStorage.getItem(REFRESH_KEY);
    if (access) await SecureStore.setItemAsync(ACCESS_KEY, access);
    if (refresh) await SecureStore.setItemAsync(REFRESH_KEY, refresh);
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
    await AsyncStorage.setItem(MIGRATED_KEY, 'true');
};

const getItem = async (key: string): Promise<string | null> => {
    await migrateFromAsyncStorage();
    if (await secureAvailable()) {
        return SecureStore.getItemAsync(key);
    }
    return AsyncStorage.getItem(key);
};

const setItem = async (key: string, value: string): Promise<void> => {
    if (await secureAvailable()) {
        await SecureStore.setItemAsync(key, value);
        return;
    }
    await AsyncStorage.setItem(key, value);
};

const removeItems = async (keys: string[]): Promise<void> => {
    if (await secureAvailable()) {
        await Promise.all(keys.map((k) => SecureStore.deleteItemAsync(k)));
        return;
    }
    await AsyncStorage.multiRemove(keys);
};

export const tokenStorage = {
    async getAccessToken(): Promise<string | null> {
        return getItem(ACCESS_KEY);
    },
    async getRefreshToken(): Promise<string | null> {
        return getItem(REFRESH_KEY);
    },
    async setTokens(access: string, refresh: string): Promise<void> {
        await setItem(ACCESS_KEY, access);
        await setItem(REFRESH_KEY, refresh);
        if (await secureAvailable()) {
            await AsyncStorage.setItem(MIGRATED_KEY, 'true');
        }
    },
    async clear(): Promise<void> {
        await removeItems([ACCESS_KEY, REFRESH_KEY]);
    },
};
