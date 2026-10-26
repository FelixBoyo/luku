import { getSupabaseAdmin } from './supabaseAdmin';
import {
    deriveHandleBaseFromEmail,
    isValidHandleFormat,
    normalizeHandleInput,
    withNumericSuffix,
} from '../lib/handleUtils';

export const isHandleTaken = async (handle: string): Promise<boolean> => {
    const normalized = normalizeHandleInput(handle);
    if (!isValidHandleFormat(normalized)) {
        return true;
    }
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .ilike('handle', normalized)
        .limit(1);

    if (error) {
        throw new Error(error.message);
    }
    return (data?.length ?? 0) > 0;
};

export const isHandleAvailable = async (handle: string): Promise<boolean> => {
    const normalized = normalizeHandleInput(handle);
    if (!isValidHandleFormat(normalized)) {
        return false;
    }
    return !(await isHandleTaken(normalized));
};

/** Pick a unique handle from email, optionally excluding a profile id (for updates). */
export const generateUniqueHandleFromEmail = async (
    email: string,
    excludeUserId?: string,
): Promise<string> => {
    const base = deriveHandleBaseFromEmail(email);
    const supabase = getSupabaseAdmin();

    const isFree = async (candidate: string): Promise<boolean> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .ilike('handle', candidate)
            .limit(1);
        if (error) {
            throw new Error(error.message);
        }
        const row = data?.[0];
        if (!row) {
            return true;
        }
        if (excludeUserId && row.id === excludeUserId) {
            return true;
        }
        return false;
    };

    let candidate = base;
    if (await isFree(candidate)) {
        return candidate;
    }

    for (let suffix = 1; suffix <= 9999; suffix += 1) {
        candidate = withNumericSuffix(base, suffix);
        if (await isFree(candidate)) {
            return candidate;
        }
    }

    throw new Error('Could not generate a unique username');
};
