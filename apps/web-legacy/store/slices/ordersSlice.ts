import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import { Order, ShippingAddress } from '../../types';
import { validateOrderData, validateOrderStatus, isValidUUID, getValidationErrorMessage } from '@core/validation';
import { withRetry } from '../../services/retryHandler';
import { trackEvent } from '../../analytics/events';

interface OrdersState {
    orders: Order[];
    currentOrder: Order | null;
    loading: boolean;
    error: string | null;
    pagination: {
        totalCount: number;
        totalPages: number;
        currentPage: number;
    } | null;
}

const initialState: OrdersState = {
    orders: [],
    currentOrder: null,
    loading: false,
    error: null,
    // Explicitly initialize pagination to null so the state
    // shape matches the declared interface and unit tests.
    pagination: null,
};

const SUPABASE_RETRY_OPTIONS = {
    maxRetries: 3,
    initialDelay: 500,
    retryableErrors: ['PGRST116', 'NetworkError', 'Failed to fetch', 'TIMEOUT'],
} as const;

// Fetch orders for buyer with pagination support
export const fetchBuyerOrders = createAsyncThunk(
    'orders/fetchBuyerOrders',
    async (params: { page?: number; pageSize?: number } = {}, { rejectWithValue }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { page = 1, pageSize = 20 } = params;
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await withRetry(
                async () => {
                    return supabase
                        .from('orders')
                        .select('*', { count: 'exact' })
                        .eq('buyer_id', user.id)
                        .order('created_at', { ascending: false })
                        .range(from, to);
                },
                SUPABASE_RETRY_OPTIONS
            );

            if (error) throw error;
            
            return {
                orders: data || [],
                totalCount: count || 0,
                totalPages: Math.ceil((count || 0) / pageSize),
                currentPage: page,
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch orders');
        }
    }
);

// Fetch orders for seller with pagination support
export const fetchSellerOrders = createAsyncThunk(
    'orders/fetchSellerOrders',
    async (params: { filters?: { status?: string }; page?: number; pageSize?: number } = {}, { rejectWithValue }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // First get the business account
            const { data: business } = await supabase
                .from('business_accounts')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!business) throw new Error('Business account not found');

            const { filters, page = 1, pageSize = 20 } = params;
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const buildQuery = () => {
                let query = supabase
                    .from('orders')
                    .select('*', { count: 'exact' })
                    .eq('seller_id', business.id)
                    .order('created_at', { ascending: false })
                    .range(from, to);

                if (filters?.status) {
                    // Validate status if provided
                    if (!validateOrderStatus(filters.status)) {
                        throw new Error(`Invalid order status: ${filters.status}`);
                    }
                    query = query.eq('status', filters.status);
                }

                return query;
            };

            const { data, error, count } = await withRetry(
                async () => buildQuery(),
                SUPABASE_RETRY_OPTIONS
            );
            if (error) throw error;
            
            return {
                orders: data || [],
                totalCount: count || 0,
                totalPages: Math.ceil((count || 0) / pageSize),
                currentPage: page,
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch seller orders');
        }
    }
);

// Fetch single order
export const fetchOrder = createAsyncThunk(
    'orders/fetchOrder',
    async (orderId: string, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Create order with atomic stock management
export const createOrder = createAsyncThunk(
    'orders/createOrder',
    async (orderData: {
        product_id: string;
        quantity: number;
        shipping_address: ShippingAddress;
        stripe_payment_intent_id: string;
    }, { rejectWithValue, getState }) => {
        try {
            // Validate input data
            const validation = validateOrderData(orderData);
            if (!validation.isValid) {
                return rejectWithValue(getValidationErrorMessage(validation.errors));
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Try to use atomic database function with retry logic, fallback to manual if RPC unavailable
            let result: any = null;
            try {
                result = await withRetry(
                    async () => {
                        const { data, error } = await supabase.rpc('create_order_with_stock_check', {
                            p_buyer_id: user.id,
                            p_product_id: orderData.product_id,
                            p_quantity: orderData.quantity,
                            p_shipping_address: orderData.shipping_address,
                            p_stripe_payment_intent_id: orderData.stripe_payment_intent_id,
                        });

                        if (error) {
                            // Check if function doesn't exist
                            if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
                                throw new Error('RPC_FUNCTION_NOT_AVAILABLE');
                            }
                            throw error;
                        }
                        return data;
                    },
                    {
                        maxRetries: 3,
                        initialDelay: 1000,
                        retryableErrors: ['PGRST116', 'NetworkError', 'TIMEOUT'],
                    }
                );
            } catch (error: any) {
                // Fallback to manual order creation if RPC function is not available
                if (error.message === 'RPC_FUNCTION_NOT_AVAILABLE') {
                    console.warn('RPC function not available, using fallback order creation');
                    
                    // Get product details
                    const { data: product, error: productError } = await supabase
                        .from('products')
                        .select('*, business_id')
                        .eq('id', orderData.product_id)
                        .single();

                    if (productError || !product) throw new Error('Product not found');

                    // Check stock (not atomic, but better than nothing)
                    if (product.stock_quantity < orderData.quantity) {
                        throw new Error(`Insufficient stock. Only ${product.stock_quantity} items available.`);
                    }

                    const totalPrice = product.price * orderData.quantity;

                    // Create order
                    const { data: order, error: orderError } = await supabase
                        .from('orders')
                        .insert({
                            buyer_id: user.id,
                            seller_id: product.business_id,
                            product_id: orderData.product_id,
                            quantity: orderData.quantity,
                            price_per_unit: product.price,
                            total_price: totalPrice,
                            shipping_address: orderData.shipping_address,
                            stripe_payment_intent_id: orderData.stripe_payment_intent_id,
                            status: 'pending',
                        })
                        .select()
                        .single();

                    if (orderError) throw orderError;

                    // Update stock (race condition possible, but better than nothing)
                    await supabase
                        .from('products')
                        .update({ stock_quantity: product.stock_quantity - orderData.quantity })
                        .eq('id', orderData.product_id);

                    return order;
                }
                throw error;
            }

            if (!result?.success) {
                const errorMsg = result?.error || 'Failed to create order';
                // Provide user-friendly error messages
                if (errorMsg.includes('Insufficient stock') || errorMsg.includes('stock')) {
                    throw new Error(`Sorry, there isn't enough stock available for this product. ${result?.available_stock ? `Only ${result.available_stock} items remaining.` : ''}`);
                }
                if (errorMsg.includes('Product not found')) {
                    throw new Error('This product is no longer available.');
                }
                throw new Error(errorMsg);
            }

            // Fetch the created order
            const { data: order, error: fetchError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', result.order_id)
                .single();

            if (fetchError) throw fetchError;

            const createdOrder = order as Order;

            // Determine if user has existing wardrobe history
            let hasWardrobeHistory = false;
            try {
                const state = getState() as { wardrobe: { items: any[] } };
                hasWardrobeHistory = !!state.wardrobe?.items?.length;
            } catch {
                // ignore
            }

            await trackEvent('order_completed', {
                orderId: createdOrder.id,
                totalValue: Number(createdOrder.total_price),
                itemCount: createdOrder.quantity,
                hasWardrobeHistory,
            });

            return createdOrder;
        } catch (error: any) {
            // Provide user-friendly error messages
            const errorMessage = error.message || 'Failed to create order. Please try again.';
            return rejectWithValue(errorMessage);
        }
    }
);

// Update order status
export const updateOrderStatus = createAsyncThunk(
    'orders/updateOrderStatus',
    async ({ orderId, status, trackingNumber }: {
        orderId: string;
        status: Order['status'];
        trackingNumber?: string;
    }, { rejectWithValue }) => {
        try {
            // Validate inputs
            if (!isValidUUID(orderId)) {
                return rejectWithValue('Invalid order ID format');
            }

            if (!validateOrderStatus(status)) {
                return rejectWithValue(`Invalid order status: ${status}. Must be one of: pending, confirmed, shipped, delivered, cancelled`);
            }

            const updates: Partial<Pick<Order, 'status' | 'tracking_number'>> = { status };
            if (trackingNumber) {
                if (typeof trackingNumber !== 'string' || trackingNumber.trim().length === 0) {
                    return rejectWithValue('Tracking number must be a non-empty string');
                }
                updates.tracking_number = trackingNumber.trim();
            }

            const { data, error } = await supabase
                .from('orders')
                .update(updates)
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update order status');
        }
    }
);

const ordersSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        clearOrders: (state) => {
            state.orders = [];
            state.currentOrder = null;
        },
        clearCurrentOrder: (state) => {
            state.currentOrder = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBuyerOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBuyerOrders.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload && typeof action.payload === 'object' && 'orders' in action.payload) {
                    state.orders = action.payload.orders;
                    state.pagination = {
                        totalCount: action.payload.totalCount,
                        totalPages: action.payload.totalPages,
                        currentPage: action.payload.currentPage,
                    };
                } else {
                    // Backward compatibility
                    state.orders = action.payload as any;
                    state.pagination = null;
                }
            })
            .addCase(fetchBuyerOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchSellerOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSellerOrders.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload && typeof action.payload === 'object' && 'orders' in action.payload) {
                    state.orders = action.payload.orders;
                    state.pagination = {
                        totalCount: action.payload.totalCount,
                        totalPages: action.payload.totalPages,
                        currentPage: action.payload.currentPage,
                    };
                } else {
                    // Backward compatibility
                    state.orders = action.payload as any;
                    state.pagination = null;
                }
            })
            .addCase(fetchSellerOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.currentOrder = action.payload;
            })
            .addCase(fetchOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.orders.unshift(action.payload);
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateOrderStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateOrderStatus.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.orders.findIndex(o => o.id === action.payload.id);
                if (index !== -1) {
                    state.orders[index] = action.payload;
                }
                if (state.currentOrder?.id === action.payload.id) {
                    state.currentOrder = action.payload;
                }
            })
            .addCase(updateOrderStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearOrders, clearCurrentOrder } = ordersSlice.actions;
export default ordersSlice.reducer;

