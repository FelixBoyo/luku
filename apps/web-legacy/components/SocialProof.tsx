import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Product } from '../types';
import { trackEvent } from '../analytics/events';

interface SocialProofProps {
    product: Product;
    className?: string;
}

const SocialProof: React.FC<SocialProofProps> = ({ product, className = '' }) => {
    const [viewers, setViewers] = useState(0);
    const [recentPurchases, setRecentPurchases] = useState(0);
    const [lowStock, setLowStock] = useState(false);

    useEffect(() => {
        // Track product view
        const trackView = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from('product_views')
                        .insert({
                            product_id: product.id,
                            user_id: user.id,
                        })
                        .catch(() => {
                            // Ignore errors (table might not exist yet)
                        });

                    // Also track generic product_viewed event
                    try {
                        await trackEvent('product_viewed', {
                            productId: product.id,
                            category: product.category,
                            priceBucket:
                                product.price < 50
                                    ? 'low'
                                    : product.price < 150
                                    ? 'medium'
                                    : 'high',
                            sellerId: product.business_id,
                        });
                    } catch {
                        // Non-fatal
                    }
                }
            } catch (error) {
                // Silently fail if table doesn't exist
            }
        };

        trackView();

        // Get current viewers (last 5 minutes)
        const fetchViewers = async () => {
            try {
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
                const { count } = await supabase
                    .from('product_views')
                    .select('*', { count: 'exact', head: true })
                    .eq('product_id', product.id)
                    .gte('viewed_at', fiveMinutesAgo)
                    .catch(() => ({ count: 0 }));

                setViewers(count || 0);
            } catch (error) {
                // Table might not exist
            }
        };

        // Get recent purchases (last 24 hours)
        const fetchRecentPurchases = async () => {
            try {
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                const { count } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('product_id', product.id)
                    .eq('status', 'delivered')
                    .gte('created_at', oneDayAgo)
                    .catch(() => ({ count: 0 }));

                setRecentPurchases(count || 0);
            } catch (error) {
                // Silently fail
            }
        };

        fetchViewers();
        fetchRecentPurchases();

        // Check low stock
        if (product.stock_quantity <= 5 && product.stock_quantity > 0) {
            setLowStock(true);
        }

        // Refresh viewers every 30 seconds
        const interval = setInterval(fetchViewers, 30000);
        return () => clearInterval(interval);
    }, [product.id, product.stock_quantity]);

    if (viewers === 0 && recentPurchases === 0 && !lowStock) {
        return null;
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {viewers > 0 && (
                <div className="flex items-center text-sm text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{viewers} {viewers === 1 ? 'person' : 'people'} viewing this</span>
                </div>
            )}
            {recentPurchases > 0 && (
                <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{recentPurchases} {recentPurchases === 1 ? 'purchase' : 'purchases'} in the last 24 hours</span>
                </div>
            )}
            {lowStock && (
                <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-full font-medium">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Only {product.stock_quantity} left in stock!</span>
                </div>
            )}
        </div>
    );
};

export default SocialProof;
