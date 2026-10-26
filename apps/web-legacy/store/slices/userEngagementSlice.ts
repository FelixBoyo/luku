import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';

export interface FeatureUsage {
    featureName: string;
    usageCount: number;
    uniqueUsers: number;
    lastUsed?: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    growthRate: number;
}

export interface UserEngagementMetrics {
    totalUsers: number;
    activeUsers: number; // Users active in last 30 days
    newUsers: number; // New users in selected period
    averageSessionDuration: number;
    featureUsage: FeatureUsage[];
    wardrobeStats: {
        totalItems: number;
        averageItemsPerUser: number;
        itemsAddedThisPeriod: number;
        mostPopularCategories: Array<{ category: string; count: number }>;
        mostPopularColors: Array<{ color: string; count: number }>;
    };
    outfitStats: {
        totalOutfits: number;
        averageOutfitsPerUser: number;
        outfitsCreatedThisPeriod: number;
        favoriteRate: number; // % of generated outfits that are favorited
    };
    marketplaceStats: {
        totalProducts: number;
        totalOrders: number;
        totalRevenue: number;
        averageOrderValue: number;
        conversionRate: number; // % of product views that lead to orders
        wishlistAdds: number;
    };
    engagementScore: number; // 0-100 score based on overall engagement
    topFeatures: string[];
    underutilizedFeatures: string[];
    recommendations: Array<{
        type: 'feature' | 'marketing' | 'development' | 'ux';
        priority: 'high' | 'medium' | 'low';
        title: string;
        description: string;
        impact: string;
    }>;
}

interface TrackedEvent {
    type: string;
    payload?: Record<string, any>;
    timestamp: string;
}

interface UserEngagementState {
    data: UserEngagementMetrics | null;
    loading: boolean;
    error: string | null;
    period: 'daily' | 'weekly' | 'monthly' | 'all';
    // Lightweight, in-memory log of recent engagement events triggered from the UI.
    // This gives us quick visibility into key flows (e.g. add_to_cart, checkout_completed)
    // ahead of a fuller backend event pipeline.
    recentEvents: TrackedEvent[];
}

const initialState: UserEngagementState = {
    data: null,
    loading: false,
    error: null,
    period: 'monthly',
    recentEvents: [],
};

// Calculate date range based on period
const getDateRange = (period: 'daily' | 'weekly' | 'monthly' | 'all') => {
    const now = new Date();
    let startDate: Date | null = null;

    if (period === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    // 'all' means no date filter

    return { startDate, endDate: now };
};

// Fetch comprehensive user engagement analytics
export const fetchUserEngagementAnalytics = createAsyncThunk(
    'userEngagement/fetchAnalytics',
    async (period: 'daily' | 'weekly' | 'monthly' | 'all', { rejectWithValue }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Check if user is admin (for now, we'll allow all authenticated users)
            // In production, you'd check for admin role

            const { startDate, endDate } = getDateRange(period);
            const dateFilter = startDate ? { start: startDate.toISOString(), end: endDate.toISOString() } : null;

            // 1. User Statistics
            // Note: Admin API requires service role key. For now, we'll estimate from data.
            // Get unique user IDs from all tables to estimate total users
            const { data: clothingUsers } = await supabase
                .from('clothing_items')
                .select('user_id');
            const { data: outfitUsers } = await supabase
                .from('outfits')
                .select('user_id');
            const { data: orderUsers } = await supabase
                .from('orders')
                .select('buyer_id');
            const { data: businessUsers } = await supabase
                .from('business_accounts')
                .select('user_id');

            const allUserIds = new Set<string>();
            clothingUsers?.forEach(item => allUserIds.add(item.user_id));
            outfitUsers?.forEach(item => allUserIds.add(item.user_id));
            orderUsers?.forEach(item => allUserIds.add(item.buyer_id));
            businessUsers?.forEach(item => allUserIds.add(item.user_id));
            const totalUsers = allUserIds.size;

            // Active users (users with activity in last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            // Get users with recent activity by checking various tables
            const { data: recentClothingItems } = await supabase
                .from('clothing_items')
                .select('user_id')
                .gte('created_at', thirtyDaysAgo.toISOString());
            
            const { data: recentOutfits } = await supabase
                .from('outfits')
                .select('user_id')
                .gte('created_at', thirtyDaysAgo.toISOString());
            
            const { data: recentOrders } = await supabase
                .from('orders')
                .select('buyer_id')
                .gte('created_at', thirtyDaysAgo.toISOString());

            const activeUserIds = new Set<string>();
            recentClothingItems?.forEach(item => activeUserIds.add(item.user_id));
            recentOutfits?.forEach(outfit => activeUserIds.add(outfit.user_id));
            recentOrders?.forEach(order => activeUserIds.add(order.buyer_id));
            const activeUsers = activeUserIds.size;

            // New users in period (estimate from first activity)
            let newUsers = 0;
            if (dateFilter) {
                const { data: newClothingItems } = await supabase
                    .from('clothing_items')
                    .select('user_id, created_at')
                    .gte('created_at', dateFilter.start)
                    .lte('created_at', dateFilter.end);
                
                // Count unique users whose first item was created in this period
                const newUserIds = new Set<string>();
                for (const item of newClothingItems || []) {
                    // Check if this is their first item
                    const { data: earlierItems } = await supabase
                        .from('clothing_items')
                        .select('id')
                        .eq('user_id', item.user_id)
                        .lt('created_at', dateFilter.start)
                        .limit(1);
                    
                    if (!earlierItems || earlierItems.length === 0) {
                        newUserIds.add(item.user_id);
                    }
                }
                newUsers = newUserIds.size;
            } else {
                newUsers = totalUsers;
            }

            // 2. Wardrobe Statistics
            const wardrobeQuery = supabase.from('clothing_items').select('*');
            if (dateFilter) {
                wardrobeQuery.gte('created_at', dateFilter.start);
            }
            const { data: allClothingItems } = await wardrobeQuery;

            const wardrobeStats = {
                totalItems: allClothingItems?.length || 0,
                averageItemsPerUser: totalUsers > 0 ? (allClothingItems?.length || 0) / totalUsers : 0,
                itemsAddedThisPeriod: dateFilter 
                    ? allClothingItems?.filter(item => {
                        const createdAt = new Date(item.created_at);
                        return createdAt >= startDate! && createdAt <= endDate;
                    }).length || 0
                    : 0,
                mostPopularCategories: [] as Array<{ category: string; count: number }>,
                mostPopularColors: [] as Array<{ color: string; count: number }>,
            };

            // Calculate popular categories and colors
            const categoryCounts = new Map<string, number>();
            const colorCounts = new Map<string, number>();
            allClothingItems?.forEach(item => {
                categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
                colorCounts.set(item.color, (colorCounts.get(item.color) || 0) + 1);
            });

            wardrobeStats.mostPopularCategories = Array.from(categoryCounts.entries())
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            wardrobeStats.mostPopularColors = Array.from(colorCounts.entries())
                .map(([color, count]) => ({ color, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // 3. Outfit Statistics
            const outfitsQuery = supabase.from('outfits').select('*');
            if (dateFilter) {
                outfitsQuery.gte('created_at', dateFilter.start);
            }
            const { data: allOutfits } = await outfitsQuery;

            const outfitStats = {
                totalOutfits: allOutfits?.length || 0,
                averageOutfitsPerUser: totalUsers > 0 ? (allOutfits?.length || 0) / totalUsers : 0,
                outfitsCreatedThisPeriod: dateFilter
                    ? allOutfits?.filter(outfit => {
                        const createdAt = new Date(outfit.created_at);
                        return createdAt >= startDate! && createdAt <= endDate;
                    }).length || 0
                    : 0,
                favoriteRate: 0, // Will be calculated based on outfits in albums
            };

            // Calculate favorite rate (outfits saved to albums)
            const { data: albumOutfits } = await supabase
                .from('album_outfits')
                .select('outfit_id');
            
            const favoritedOutfitIds = new Set(albumOutfits?.map(ao => ao.outfit_id) || []);
            outfitStats.favoriteRate = allOutfits && allOutfits.length > 0
                ? (favoritedOutfitIds.size / allOutfits.length) * 100
                : 0;

            // 4. Marketplace Statistics
            const { data: allProducts } = await supabase
                .from('products')
                .select('*');
            
            const ordersQuery = supabase.from('orders').select('*');
            if (dateFilter) {
                ordersQuery.gte('created_at', dateFilter.start);
            }
            const { data: allOrders } = await ordersQuery;

            const { data: wishlistItems } = await supabase
                .from('wishlist')
                .select('*');
            if (dateFilter && wishlistItems) {
                // Filter wishlist by date if needed
            }

            // Product views for conversion funnel (may fail if table not created yet)
            let totalProductViews = 0;
            try {
                const viewsQuery = supabase.from('product_views').select('*');
                if (dateFilter) {
                    viewsQuery
                        .gte('viewed_at', dateFilter.start)
                        .lte('viewed_at', dateFilter.end);
                }
                const { data: productViews } = await viewsQuery;
                totalProductViews = productViews?.length || 0;
            } catch {
                // Table might not exist yet; keep views at 0
            }

            const totalRevenue = allOrders?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;
            const totalOrders = allOrders?.length || 0;
            const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
            const conversionRate = totalProductViews > 0
                ? (totalOrders / totalProductViews) * 100
                : 0;

            const marketplaceStats = {
                totalProducts: allProducts?.length || 0,
                totalOrders,
                totalRevenue,
                averageOrderValue,
                conversionRate,
                wishlistAdds: wishlistItems?.length || 0,
            };

            // 5. Feature Usage Analysis
            // Analyze usage based on database records
            const featureUsage: FeatureUsage[] = [];

            // Wardrobe Management
            const wardrobeUsage = {
                featureName: 'Wardrobe Management',
                usageCount: allClothingItems?.length || 0,
                uniqueUsers: new Set(allClothingItems?.map(item => item.user_id) || []).size,
                trend: 'stable' as const,
                growthRate: 0,
            };
            featureUsage.push(wardrobeUsage);

            // Outfit Suggestions (inferred from outfits created)
            const outfitSuggestionsUsage = {
                featureName: 'Outfit Suggestions',
                usageCount: allOutfits?.length || 0,
                uniqueUsers: new Set(allOutfits?.map(outfit => outfit.user_id) || []).size,
                trend: 'stable' as const,
                growthRate: 0,
            };
            featureUsage.push(outfitSuggestionsUsage);

            // Albums
            const { data: albums } = await supabase.from('albums').select('*');
            const albumsUsage = {
                featureName: 'Albums',
                usageCount: albums?.length || 0,
                uniqueUsers: new Set(albums?.map(album => album.user_id) || []).size,
                trend: 'stable' as const,
                growthRate: 0,
            };
            featureUsage.push(albumsUsage);

            // Trip Planner
            const tripsQuery = supabase.from('trips').select('*');
            if (dateFilter) {
                tripsQuery.gte('created_at', dateFilter.start);
            }
            const { data: trips } = await tripsQuery;
            const tripsUsage = {
                featureName: 'Trip Planner',
                usageCount: trips?.length || 0,
                uniqueUsers: new Set(trips?.map(trip => trip.user_id) || []).size,
                trend: 'stable' as const,
                growthRate: 0,
            };
            featureUsage.push(tripsUsage);

            // Style Playground
            const playgroundQuery = supabase.from('style_playground_sessions').select('*');
            if (dateFilter) {
                playgroundQuery.gte('created_at', dateFilter.start);
            }
            const { data: playgroundSessions } = await playgroundQuery;
            const playgroundUsage = {
                featureName: 'Style Playground',
                usageCount: playgroundSessions?.length || 0,
                uniqueUsers: new Set(playgroundSessions?.map(session => session.user_id) || []).size,
                trend: 'stable' as const,
                growthRate: 0,
            };
            featureUsage.push(playgroundUsage);

            // Marketplace
            const marketplaceUsage = {
                featureName: 'Marketplace',
                usageCount: totalOrders,
                uniqueUsers: new Set(allOrders?.map(order => order.buyer_id) || []).size,
                trend: 'stable' as const,
                growthRate: 0,
            };
            featureUsage.push(marketplaceUsage);

            // Business Accounts
            const { data: businessAccounts } = await supabase
                .from('business_accounts')
                .select('*');
            const businessUsage = {
                featureName: 'Business Accounts',
                usageCount: businessAccounts?.length || 0,
                uniqueUsers: new Set(businessAccounts?.map(ba => ba.user_id) || []).size,
                trend: 'stable' as const,
                growthRate: 0,
            };
            featureUsage.push(businessUsage);

            // 6. Calculate Engagement Score (0-100)
            const engagementScore = calculateEngagementScore({
                totalUsers,
                activeUsers,
                wardrobeStats,
                outfitStats,
                marketplaceStats,
                featureUsage,
            });

            // 7. Identify top and underutilized features
            const sortedFeatures = [...featureUsage].sort((a, b) => b.usageCount - a.usageCount);
            const topFeatures = sortedFeatures.slice(0, 3).map(f => f.featureName);
            const underutilizedFeatures = sortedFeatures
                .filter(f => f.uniqueUsers < totalUsers * 0.1) // Used by less than 10% of users
                .map(f => f.featureName);

            // 8. Generate Recommendations
            const recommendations = generateRecommendations({
                featureUsage,
                wardrobeStats,
                outfitStats,
                marketplaceStats,
                engagementScore,
                topFeatures,
                underutilizedFeatures,
            });

            return {
                totalUsers,
                activeUsers,
                newUsers,
                averageSessionDuration: 0, // Would need session tracking
                featureUsage,
                wardrobeStats,
                outfitStats,
                marketplaceStats,
                engagementScore,
                topFeatures,
                underutilizedFeatures,
                recommendations,
            };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Helper function to calculate engagement score
function calculateEngagementScore(metrics: {
    totalUsers: number;
    activeUsers: number;
    wardrobeStats: any;
    outfitStats: any;
    marketplaceStats: any;
    featureUsage: FeatureUsage[];
}): number {
    let score = 0;
    const maxScore = 100;

    // Active user rate (30 points)
    if (metrics.totalUsers > 0) {
        const activeRate = (metrics.activeUsers / metrics.totalUsers) * 100;
        score += Math.min(30, (activeRate / 100) * 30);
    }

    // Wardrobe engagement (20 points)
    if (metrics.totalUsers > 0) {
        const avgItems = metrics.wardrobeStats.averageItemsPerUser;
        score += Math.min(20, (avgItems / 50) * 20); // 50 items = full score
    }

    // Outfit creation (20 points)
    if (metrics.totalUsers > 0) {
        const avgOutfits = metrics.outfitStats.averageOutfitsPerUser;
        score += Math.min(20, (avgOutfits / 20) * 20); // 20 outfits = full score
    }

    // Feature diversity (15 points)
    const featuresUsed = metrics.featureUsage.filter(f => f.uniqueUsers > 0).length;
    score += Math.min(15, (featuresUsed / 8) * 15); // 8 features = full score

    // Marketplace engagement (15 points)
    if (metrics.marketplaceStats.totalOrders > 0) {
        score += Math.min(15, (metrics.marketplaceStats.totalOrders / 100) * 15);
    }

    return Math.round(score);
}

// Helper function to generate actionable recommendations
function generateRecommendations(metrics: {
    featureUsage: FeatureUsage[];
    wardrobeStats: any;
    outfitStats: any;
    marketplaceStats: any;
    engagementScore: number;
    topFeatures: string[];
    underutilizedFeatures: string[];
}): Array<{
    type: 'feature' | 'marketing' | 'development' | 'ux';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
}> {
    const recommendations: Array<{
        type: 'feature' | 'marketing' | 'development' | 'ux';
        priority: 'high' | 'medium' | 'low';
        title: string;
        description: string;
        impact: string;
    }> = [];

    // Low engagement score
    if (metrics.engagementScore < 40) {
        recommendations.push({
            type: 'marketing',
            priority: 'high',
            title: 'Improve User Onboarding',
            description: 'Engagement score is below 40. Focus on improving user onboarding to increase feature discovery and usage.',
            impact: 'Expected 20-30% increase in active users within 30 days',
        });
    }

    // Underutilized features
    if (metrics.underutilizedFeatures.length > 0) {
        recommendations.push({
            type: 'marketing',
            priority: 'high',
            title: `Promote ${metrics.underutilizedFeatures[0]}`,
            description: `${metrics.underutilizedFeatures[0]} is used by less than 10% of users. Consider in-app tutorials, email campaigns, or feature highlights.`,
            impact: 'Expected 15-25% increase in feature adoption',
        });
    }

    // Low outfit favorite rate
    if (metrics.outfitStats.favoriteRate < 30) {
        recommendations.push({
            type: 'ux',
            priority: 'medium',
            title: 'Improve Outfit Suggestion Quality',
            description: `Only ${metrics.outfitStats.favoriteRate.toFixed(1)}% of generated outfits are being favorited. Consider refining AI prompts or adding user preference learning.`,
            impact: 'Expected 10-20% increase in user satisfaction',
        });
    }

    // Low marketplace conversion
    if (metrics.marketplaceStats.conversionRate === 0 && metrics.marketplaceStats.totalProducts > 0) {
        recommendations.push({
            type: 'development',
            priority: 'high',
            title: 'Implement Product View Tracking',
            description: 'Add product view tracking to calculate accurate conversion rates and identify optimization opportunities.',
            impact: 'Enables data-driven marketplace optimization',
        });
    }

    // Low average items per user
    if (metrics.wardrobeStats.averageItemsPerUser < 10) {
        recommendations.push({
            type: 'feature',
            priority: 'medium',
            title: 'Simplify Wardrobe Upload Process',
            description: 'Users have fewer than 10 items on average. Consider bulk upload, mobile app improvements, or integration with shopping apps.',
            impact: 'Expected 30-40% increase in wardrobe size',
        });
    }

    // High engagement - capitalize on success
    if (metrics.engagementScore > 70) {
        recommendations.push({
            type: 'marketing',
            priority: 'low',
            title: 'Leverage High Engagement for Growth',
            description: 'Engagement is strong. Consider referral programs, social sharing features, or case studies to attract new users.',
            impact: 'Expected 15-25% increase in new user acquisition',
        });
    }

    // Top features - enhance further
    if (metrics.topFeatures.length > 0) {
        recommendations.push({
            type: 'development',
            priority: 'medium',
            title: `Enhance ${metrics.topFeatures[0]}`,
            description: `${metrics.topFeatures[0]} is the most popular feature. Consider adding advanced features, integrations, or premium options.`,
            impact: 'Expected 10-15% increase in feature value',
        });
    }

    return recommendations;
}

const userEngagementSlice = createSlice({
    name: 'userEngagement',
    initialState,
    reducers: {
        setPeriod: (state, action) => {
            state.period = action.payload;
        },
        clearAnalytics: (state) => {
            state.data = null;
            state.error = null;
        },
        logEvent: (
            state,
            action: PayloadAction<{ type: string; payload?: Record<string, any> }>
        ) => {
            const event: TrackedEvent = {
                type: action.payload.type,
                payload: action.payload.payload,
                timestamp: new Date().toISOString(),
            };
            state.recentEvents.unshift(event);
            // Keep only the most recent 100 events in memory to avoid unbounded growth
            if (state.recentEvents.length > 100) {
                state.recentEvents.pop();
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserEngagementAnalytics.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserEngagementAnalytics.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchUserEngagementAnalytics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setPeriod, clearAnalytics, logEvent } = userEngagementSlice.actions;
export default userEngagementSlice.reducer;
