# LUKU Backend - Quick Start Guide

> Moved from repo root. Web Redux examples reference `apps/web-legacy/store/`. Phase 2 mobile uses Express BFF — see [`../architecture/BFF_OVERVIEW.md`](../architecture/BFF_OVERVIEW.md).

## 🚀 Getting Started

### 1. Apply Database Optimizations

Run the SQL file in your Supabase SQL Editor:

```bash
# Copy and paste the contents of database/legacy/backend_optimizations.sql
# into your Supabase SQL Editor and execute
```

### 2. Verify Installation

Check that functions are created:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name IN (
    'create_order_with_stock_check',
    'get_business_analytics',
    'get_top_selling_products',
    'get_mood_board_product_recommendations',
    'search_products_paginated'
);
```

## 📝 Common Usage Patterns

### Paginated Product Listing

```typescript
import { fetchAllProducts } from '../store/slices/productsSlice';

// Fetch first page
dispatch(fetchAllProducts({
    filters: { 
        category: 'tops',
        color: 'blue',
        search: 'summer'
    },
    page: 1,
    pageSize: 20,
    usePagination: true
}));

// Access results
const { products, pagination } = useSelector(state => state.products);
// products: Product[]
// pagination: { totalCount, totalPages, currentPage }
```

### Atomic Order Creation

```typescript
import { createOrder } from '../store/slices/ordersSlice';

// Order creation now uses atomic stock management automatically
dispatch(createOrder({
    product_id: 'product-uuid',
    quantity: 2,
    shipping_address: {
        street: '123 Main St',
        city: 'New York',
        // ...
    },
    stripe_payment_intent_id: 'pi_...'
}));
```

### Business Analytics

```typescript
import { fetchBusinessAnalytics } from '../store/slices/analyticsSlice';

// Fetch analytics (now uses optimized database function)
dispatch(fetchBusinessAnalytics('monthly')); // 'daily' | 'weekly' | 'monthly'

// Access results
const analytics = useSelector(state => state.analytics.data);
// analytics: {
//   totalRevenue, totalOrders, averageOrderValue,
//   totalProducts, activeListings, lowStockProducts,
//   topSellingProducts, salesByPeriod
// }
```

### Mood Board Product Recommendations

```typescript
import { getMoodBoardProductRecommendations } from '../services/moodBoardService';

// Get product recommendations for a mood board
const recommendations = await getMoodBoardProductRecommendations(
    albumId, 
    10 // limit
);
// Returns: Product[] sorted by relevance
```

### Outfit-Based Recommendations

```typescript
import { getOutfitProductRecommendations } from '../services/moodBoardService';

const recommendations = await getOutfitProductRecommendations(
    outfit, // { items: [...] }
    5 // limit
);
```

## 🔧 Database Functions Reference

### `create_order_with_stock_check`
Atomic order creation with stock management.

**Parameters:**
- `p_buyer_id`: UUID
- `p_product_id`: UUID
- `p_quantity`: INTEGER
- `p_shipping_address`: JSONB
- `p_stripe_payment_intent_id`: TEXT

**Returns:** JSONB with `success`, `order_id`, `total_price`, or `error`

### `get_business_analytics`
Server-side analytics calculation.

**Parameters:**
- `p_business_id`: UUID
- `p_start_date`: TIMESTAMPTZ
- `p_end_date`: TIMESTAMPTZ

**Returns:** JSONB with analytics metrics

### `get_top_selling_products`
Optimized top products query.

**Parameters:**
- `p_business_id`: UUID
- `p_start_date`: TIMESTAMPTZ
- `p_end_date`: TIMESTAMPTZ
- `p_limit`: INTEGER (default: 10)

**Returns:** Table with product_id, product_name, total_sold, revenue

### `get_mood_board_product_recommendations`
Product recommendations based on mood board style.

**Parameters:**
- `p_album_id`: UUID
- `p_limit`: INTEGER (default: 10)

**Returns:** Table with product details and relevance_score

### `search_products_paginated`
Full-text search with pagination.

**Parameters:**
- `p_search_term`: TEXT (optional)
- `p_category`: TEXT (optional)
- `p_color`: TEXT (optional)
- `p_style`: TEXT (optional)
- `p_min_price`: DECIMAL (optional)
- `p_max_price`: DECIMAL (optional)
- `p_page`: INTEGER (default: 1)
- `p_page_size`: INTEGER (default: 20)

**Returns:** JSONB with products array, total_count, total_pages

## 🎯 Best Practices

### 1. Always Use Pagination for Lists
```typescript
// ✅ Good
dispatch(fetchAllProducts({ page: 1, pageSize: 20, usePagination: true }));

// ❌ Bad (loads all products)
dispatch(fetchAllProducts());
```

### 2. Use Database Functions for Complex Operations
```typescript
// ✅ Good (uses optimized function)
dispatch(fetchBusinessAnalytics('monthly'));

// ❌ Bad (client-side calculation)
// Don't fetch all orders and calculate client-side
```

### 3. Handle Errors Gracefully
```typescript
try {
    await dispatch(createOrder(orderData));
} catch (error) {
    if (error.message.includes('Insufficient stock')) {
        // Show user-friendly message
    }
}
```

### 4. Use Retry Logic for Network Operations
The `marketplaceService` now includes automatic retry logic for transient failures.

## 🐛 Troubleshooting

### Function Not Found
```sql
-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'function_name';
```

### Permission Denied
```sql
-- Grant permissions (if needed)
GRANT EXECUTE ON FUNCTION public.function_name TO authenticated;
```

### Slow Queries
- Check if indexes are created: `\d+ table_name` in psql
- Use EXPLAIN ANALYZE to see query plan
- Consider using materialized views for heavy analytics

## 📊 Performance Tips

1. **Use Pagination**: Always paginate large result sets
2. **Use Database Functions**: Move calculations to the database
3. **Monitor Indexes**: Ensure indexes exist for filtered columns
4. **Cache When Possible**: Consider caching frequently accessed data
5. **Batch Operations**: Process multiple items in batches

## 🔐 Security Notes

- All functions use `security definer` for proper RLS enforcement
- RLS policies are automatically applied
- User authentication is required for all operations
- Input validation happens at the database level

## 📚 Additional Resources

- See `BACKEND_IMPROVEMENTS.md` for detailed documentation
- Check `database/legacy/backend_optimizations.sql` for function definitions
- Review `services/moodBoardService.ts` for mood board integration examples

---

**Need Help?** Check the main documentation or reach out to the backend team.
