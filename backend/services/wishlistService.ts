import { getSupabaseAdmin } from '../data/supabaseAdmin';
import type { WishlistItemDto } from '../../packages/contracts/src/products';

export const getWishlist = async (userId: string): Promise<WishlistItemDto[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('wishlist')
        .select('product_id, created_at')
        .eq('user_id', userId);

    if (error) {
        throw new Error(error.message);
    }

    return (data || []).map(row => ({
        productId: row.product_id,
        addedAt: row.created_at,
    }));
};

export const addWishlistItem = async (userId: string, productId: string): Promise<void> => {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('wishlist')
        .insert({ user_id: userId, product_id: productId });

    if (error && error.code !== '23505') { // Ignore unique constraint violation
        throw new Error(error.message);
    }
};

export const removeWishlistItem = async (userId: string, productId: string): Promise<void> => {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

    if (error) {
        throw new Error(error.message);
    }
};
