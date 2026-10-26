import { supabase } from './supabaseClient';
import { Product } from '../types';
import { Outfit } from '../types';

/**
 * Enhanced marketplace service with retry logic and better error handling
 */
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retryOperation<T>(
    operation: () => Promise<T>,
    retries = MAX_RETRIES
): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        if (retries > 0 && (error.code === 'PGRST116' || error.message?.includes('network'))) {
            // Retry on network errors or connection issues
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            return retryOperation(operation, retries - 1);
        }
        throw error;
    }
}

/**
 * Get recommended marketplace products based on an outfit
 * This finds products that match the categories, colors, and styles in the outfit
 */
export const getRecommendedProducts = async (
    outfit: Outfit,
    limit: number = 3
): Promise<Product[]> => {
    return retryOperation(async () => {
        // Extract categories, colors, and styles from outfit items
        const categories = [...new Set(outfit.items.map((item) => item.category))];
        const colors = [...new Set(outfit.items.map((item) => item.color))];
        const styles = [...new Set(outfit.items.map((item) => item.style))];

        if (categories.length === 0 && colors.length === 0 && styles.length === 0) {
            return [];
        }

        // Query products that match any of the outfit's characteristics
        // Use proper Supabase .in() method with arrays
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

        // Filter and rank by relevance (matching color and style)
        const rankedProducts = (data || [])
            .map((product) => {
                let score = 0;
                if (colors.includes(product.color)) score += 2;
                if (styles.includes(product.style)) score += 2;
                if (categories.includes(product.category)) score += 1;
                return { ...product, relevanceScore: score };
            })
            .filter((p) => p.relevanceScore > 0)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit)
            .map(({ relevanceScore, ...product }) => product);

        return rankedProducts;
    }).catch((error) => {
        console.error('Error fetching recommended products:', error);
        return [];
    });
};

/**
 * Get recommended products for multiple outfits
 */
export const getRecommendedProductsForOutfits = async (
    outfits: Outfit[],
    limitPerOutfit: number = 3
): Promise<Map<string, Product[]>> => {
    const recommendations = new Map<string, Product[]>();

    // Process in batches to avoid overwhelming the database
    const batchSize = 5;
    for (let i = 0; i < outfits.length; i += batchSize) {
        const batch = outfits.slice(i, i + batchSize);
        await Promise.all(
            batch.map(async (outfit) => {
                const products = await getRecommendedProducts(outfit, limitPerOutfit);
                recommendations.set(outfit.id, products);
            })
        );
    }

    return recommendations;
};

/**
 * Get recommended marketplace products based on user's wardrobe items
 * This finds products that match the categories, colors, and styles in the wardrobe
 * Returns products with match reasons for display
 */
export interface WardrobeRecommendation extends Product {
    matchReasons: string[];
}

export const getWardrobeBasedRecommendations = async (
    wardrobeItems: Array<{ category: string; color: string; style: string }>,
    limit: number = 12
): Promise<WardrobeRecommendation[]> => {
    return retryOperation(async () => {
        if (wardrobeItems.length === 0) {
            return [];
        }

        // Extract categories, colors, and styles from wardrobe items
        const categories = [...new Set(wardrobeItems.map((item) => item.category))];
        const colors = [...new Set(wardrobeItems.map((item) => item.color))];
        const styles = [...new Set(wardrobeItems.map((item) => item.style))];

        if (categories.length === 0 && colors.length === 0 && styles.length === 0) {
            return [];
        }

        // Query products that match any of the wardrobe's characteristics
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

        // Filter and rank by relevance (matching color and style)
        const rankedProducts = (data || [])
            .map((product) => {
                let score = 0;
                const matchReasons: string[] = [];
                
                if (colors.includes(product.color)) {
                    score += 2;
                    matchReasons.push(`Matches ${product.color} color`);
                }
                if (styles.includes(product.style)) {
                    score += 2;
                    matchReasons.push(`Same ${product.style} style`);
                }
                if (categories.includes(product.category)) {
                    score += 1;
                    matchReasons.push(`Same ${product.category} category`);
                }
                
                return { ...product, relevanceScore: score, matchReasons };
            })
            .filter((p) => p.relevanceScore > 0)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit)
            .map(({ relevanceScore, ...product }) => product);

        return rankedProducts;
    }).catch((error) => {
        console.error('Error fetching wardrobe-based recommendations:', error);
        return [];
    });
};

