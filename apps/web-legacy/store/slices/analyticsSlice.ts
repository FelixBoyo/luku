import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import { withRetry } from '../../services/retryHandler';

interface AnalyticsData {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalProducts: number;
    activeListings: number;
    lowStockProducts: number;
    topSellingProducts: Array<{
        product_id: string;
        product_name: string;
        total_sold: number;
        revenue: number;
    }>;
    salesByPeriod: Array<{
        period: string;
        revenue: number;
        orders: number;
    }>;
}

interface AnalyticsState {
    data: AnalyticsData | null;
    loading: boolean;
    error: string | null;
    period: 'daily' | 'weekly' | 'monthly';
}

const initialState: AnalyticsState = {
    data: null,
    loading: false,
    error: null,
    period: 'monthly',
};

// Fetch analytics for a business using optimized database functions
export const fetchBusinessAnalytics = createAsyncThunk(
    'analytics/fetchBusinessAnalytics',
    async (period: 'daily' | 'weekly' | 'monthly', { rejectWithValue }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Get business account
            const { data: business, error: businessError } = await supabase
                .from('business_accounts')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (businessError || !business) throw new Error('Business account not found');

            const businessId = business.id;

            // Calculate date range based on period
            const now = new Date();
            let startDate: Date;
            let endDate = new Date(now);
            
            if (period === 'daily') {
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else if (period === 'weekly') {
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
            } else {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            // Use optimized database function for analytics with retry and fallback
            let analyticsData: any = null;
            let topProducts: any[] = [];

            try {
                analyticsData = await withRetry(
                    async () => {
                        const { data, error } = await supabase.rpc(
                            'get_business_analytics',
                            {
                                p_business_id: businessId,
                                p_start_date: startDate.toISOString(),
                                p_end_date: endDate.toISOString(),
                            }
                        );
                        if (error) throw error;
                        return data;
                    },
                    {
                        maxRetries: 2,
                        initialDelay: 500,
                        retryableErrors: ['PGRST116', 'NetworkError'],
                    }
                );
            } catch (error: any) {
                // Fallback: if RPC function doesn't exist or fails, continue with manual calculation
                console.warn('Analytics RPC function unavailable, using fallback calculation');
            }

            try {
                topProducts = await withRetry(
                    async () => {
                        const { data, error } = await supabase.rpc(
                            'get_top_selling_products',
                            {
                                p_business_id: businessId,
                                p_start_date: startDate.toISOString(),
                                p_end_date: endDate.toISOString(),
                                p_limit: 10,
                            }
                        );
                        if (error) throw error;
                        return data || [];
                    },
                    {
                        maxRetries: 2,
                        initialDelay: 500,
                        retryableErrors: ['PGRST116', 'NetworkError'],
                    }
                );
            } catch (error: any) {
                // Fallback: continue without top products if RPC fails
                console.warn('Top products RPC function unavailable');
            }

            // Fetch orders for sales by period calculation (still needed for period breakdown)
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('created_at, total_price')
                .eq('seller_id', businessId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: true });

            if (ordersError) throw ordersError;

            // Sales by period
            const salesByPeriodMap = new Map<string, { revenue: number; orders: number }>();
            orders?.forEach(order => {
                const orderDate = new Date(order.created_at);
                let periodKey: string;

                if (period === 'daily') {
                    periodKey = orderDate.toLocaleDateString();
                } else if (period === 'weekly') {
                    const weekStart = new Date(orderDate);
                    weekStart.setDate(orderDate.getDate() - orderDate.getDay());
                    periodKey = weekStart.toLocaleDateString();
                } else {
                    periodKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
                }

                const existing = salesByPeriodMap.get(periodKey) || { revenue: 0, orders: 0 };
                existing.revenue += Number(order.total_price);
                existing.orders += 1;
                salesByPeriodMap.set(periodKey, existing);
            });

            const salesByPeriod = Array.from(salesByPeriodMap.entries())
                .map(([period, data]) => ({ period, ...data }))
                .sort((a, b) => a.period.localeCompare(b.period));

            // If RPC functions failed, calculate manually as fallback
            if (!analyticsData) {
                // Calculate basic metrics from orders
                const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;
                const totalOrders = orders?.length || 0;
                const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

                // Get product stats
                const { data: products } = await supabase
                    .from('products')
                    .select('id, is_active, stock_quantity')
                    .eq('business_id', businessId);

                const totalProducts = products?.length || 0;
                const activeListings = products?.filter(p => p.is_active).length || 0;
                const lowStockProducts = products?.filter(p => p.stock_quantity < 10).length || 0;

                analyticsData = {
                    total_revenue: totalRevenue,
                    total_orders: totalOrders,
                    average_order_value: averageOrderValue,
                    total_products: totalProducts,
                    active_listings: activeListings,
                    low_stock_products: lowStockProducts,
                };
            }

            return {
                totalRevenue: analyticsData?.total_revenue || 0,
                totalOrders: analyticsData?.total_orders || 0,
                averageOrderValue: analyticsData?.average_order_value || 0,
                totalProducts: analyticsData?.total_products || 0,
                activeListings: analyticsData?.active_listings || 0,
                lowStockProducts: analyticsData?.low_stock_products || 0,
                topSellingProducts: topProducts || [],
                salesByPeriod,
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch analytics. Please try again.');
        }
    }
);

const analyticsSlice = createSlice({
    name: 'analytics',
    initialState,
    reducers: {
        setPeriod: (state, action) => {
            state.period = action.payload;
        },
        clearAnalytics: (state) => {
            state.data = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBusinessAnalytics.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBusinessAnalytics.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchBusinessAnalytics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setPeriod, clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;

