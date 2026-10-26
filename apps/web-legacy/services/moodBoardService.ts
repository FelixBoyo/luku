import { supabase } from './supabaseClient';
import { Product, Album } from '../types';

/**
 * Get product recommendations based on a mood board (album)
 * This integrates mood boards with the marketplace by finding products
 * that match the style, colors, and categories in the mood board
 */
export const getMoodBoardProductRecommendations = async (
    albumId: string,
    limit: number = 10
): Promise<Product[]> => {
    try {
        const { data, error } = await supabase.rpc('get_mood_board_product_recommendations', {
            p_album_id: albumId,
            p_limit: limit,
        });

        if (error) throw error;

        // Transform database result to Product type
        return (data || []).map((item: any) => ({
            id: item.product_id,
            business_id: '', // Not returned by function, would need to join if needed
            name: item.product_name,
            description: '',
            price: Number(item.price),
            category: item.category,
            color: item.color,
            style: item.style,
            season: '',
            size: '',
            stock_quantity: 0,
            image_urls: item.image_urls || [],
            is_featured: false,
            is_active: true,
            average_rating: Number(item.average_rating) || 0,
            review_count: 0,
            created_at: '',
            updated_at: '',
        }));
    } catch (error) {
        console.error('Error fetching mood board product recommendations:', error);
        return [];
    }
};

/**
 * Get product recommendations for all albums (mood boards) of a user
 */
export const getAllMoodBoardRecommendations = async (
    albums: Album[],
    limitPerAlbum: number = 5
): Promise<Map<string, Product[]>> => {
    const recommendations = new Map<string, Product[]>();

    await Promise.all(
        albums.map(async (album) => {
            const products = await getMoodBoardProductRecommendations(album.id, limitPerAlbum);
            recommendations.set(album.id, products);
        })
    );

    return recommendations;
};

/**
 * Get products that match a specific outfit's style
 * Useful for suggesting marketplace products to complete an outfit
 */
export const getOutfitProductRecommendations = async (
    outfit: { items: Array<{ category: string; color: string; style: string }> },
    limit: number = 5
): Promise<Product[]> => {
    try {
        // Extract categories, colors, and styles from outfit
        const categories = [...new Set(outfit.items.map((item) => item.category))];
        const colors = [...new Set(outfit.items.map((item) => item.color))];
        const styles = [...new Set(outfit.items.map((item) => item.style))];

        // Query products matching outfit characteristics
        let query = supabase
            .from('products_with_ratings')
            .select('*')
            .eq('is_active', true);

        // Build OR conditions - Supabase PostgREST format
        const orConditions: string[] = [];
        
        if (categories.length > 0) {
            orConditions.push(`category.in.(${categories.join(',')})`);
        }
        if (colors.length > 0) {
            orConditions.push(`color.in.(${colors.join(',')})`);
        }
        if (styles.length > 0) {
            orConditions.push(`style.in.(${styles.join(',')})`);
        }

        if (orConditions.length > 0) {
            query = query.or(orConditions.join(','));
        } else {
            // If no conditions, return empty early
            return [];
        }

        const { data, error } = await query.limit(limit * 2); // Get more to filter

        if (error) throw error;

        // Rank by relevance
        const rankedProducts = (data || [])
            .map((product) => {
                let score = 0;
                if (categories.includes(product.category)) score += 1;
                if (colors.includes(product.color)) score += 2;
                if (styles.includes(product.style)) score += 2;
                return { ...product, relevanceScore: score };
            })
            .filter((p) => p.relevanceScore > 0)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit)
            .map(({ relevanceScore, ...product }) => product);

        return rankedProducts;
    } catch (error) {
        console.error('Error fetching outfit product recommendations:', error);
        return [];
    }
};
