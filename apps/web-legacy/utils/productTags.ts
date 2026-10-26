import { supabase } from '../services/supabaseClient';

export const saveProductTags = async (productId: string, tags: string[]): Promise<void> => {
    try {
        // Delete existing tags
        await supabase
            .from('product_tags')
            .delete()
            .eq('product_id', productId);

        // Insert new tags
        if (tags.length > 0) {
            const tagInserts = tags.map(tag => ({
                product_id: productId,
                tag: tag.trim().toLowerCase(),
            }));

            const { error } = await supabase
                .from('product_tags')
                .insert(tagInserts);

            if (error) throw error;
        }
    } catch (error) {
        console.error('Failed to save product tags:', error);
        throw error;
    }
};

export const getProductTags = async (productId: string): Promise<string[]> => {
    try {
        const { data, error } = await supabase
            .from('product_tags')
            .select('tag')
            .eq('product_id', productId);

        if (error) throw error;
        return data?.map(item => item.tag) || [];
    } catch (error) {
        console.error('Failed to get product tags:', error);
        return [];
    }
};

export const searchProductsByTag = async (tag: string): Promise<string[]> => {
    try {
        const { data, error } = await supabase
            .from('product_tags')
            .select('product_id')
            .eq('tag', tag.toLowerCase());

        if (error) throw error;
        return data?.map(item => item.product_id) || [];
    } catch (error) {
        console.error('Failed to search products by tag:', error);
        return [];
    }
};
