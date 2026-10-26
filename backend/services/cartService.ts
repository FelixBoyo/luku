import { getSupabaseAdmin } from '../data/supabaseAdmin';
import type { CartItemDto } from '../../packages/contracts/src/cart';
import type { ProductDto } from '../../packages/contracts/src/products';
import { loadBusinessMap, type SellerBusiness } from './productsService';
import { CannotBuyOwnItemError } from './cannotBuyOwnItem';

export { CannotBuyOwnItemError } from './cannotBuyOwnItem';

const mapProductRowToDto = (
    row: Record<string, any>,
    business?: SellerBusiness,
): ProductDto => ({
    id: String(row.id),
    name: String(row.name),
    description: row.description != null ? String(row.description) : null,
    price: Number(row.price),
    category: String(row.category),
    color: String(row.color),
    style: String(row.style),
    size: String(row.size),
    imageUrls: Array.isArray(row.image_urls) ? (row.image_urls as string[]) : [],
    isFeatured: Boolean(row.is_featured),
    isActive: Boolean(row.is_active),
    averageRating: row.average_rating != null ? Number(row.average_rating) : null,
    reviewCount: row.review_count != null ? Number(row.review_count) : 0,
    // Absent means unknown, not sold out — the cart hides lines it reads as zero.
    stockQuantity: row.stock_quantity != null ? Number(row.stock_quantity) : undefined,
    businessId: String(row.business_id),
    sellerName: business?.business_name ?? undefined,
    sellerUserId: business?.user_id,
    sellerAvatarUrl: business?.logo_url ?? undefined,
});

const mapCartRowToDto = (
    row: Record<string, any>,
    businesses?: Map<string, SellerBusiness>,
): CartItemDto => ({
    id: String(row.id),
    userId: String(row.user_id),
    productId: String(row.product_id),
    quantity: Number(row.quantity),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    product: row.product
        ? mapProductRowToDto(
              row.product,
              businesses?.get(String(row.product.business_id)),
          )
        : undefined,
});

/** Seller names live on `business_accounts`; the cart groups by seller so it needs them. */
const loadCartBusinesses = async (
    rows: Record<string, any>[],
): Promise<Map<string, SellerBusiness>> => {
    const businessIds = [
        ...new Set(
            rows
                .map((row) => row.product?.business_id)
                .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0),
        ),
    ];
    if (businessIds.length === 0) {
        return new Map();
    }
    return loadBusinessMap(businessIds);
};

export const getCart = async (userId: string): Promise<CartItemDto[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    const rows = data ?? [];
    const businesses = await loadCartBusinesses(rows);
    return rows.map((row) => mapCartRowToDto(row, businesses));
};

const assertNotOwnCatalogProduct = async (
    userId: string,
    businessId: string,
): Promise<void> => {
    const supabase = getSupabaseAdmin();
    // Direct lookup — do not use `loadBusinessMap` here; that cache would let a
    // later self-buy check see a stale owner from an earlier cart hydrate.
    const { data: business, error } = await supabase
        .from('business_accounts')
        .select('user_id')
        .eq('id', businessId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (business?.user_id === userId) {
        throw new CannotBuyOwnItemError();
    }
};

export const addToCart = async (
    userId: string,
    productId: string,
    quantity = 1,
): Promise<CartItemDto> => {
    const supabase = getSupabaseAdmin();

    // Own-item check runs before increment too: a leftover cart line of the
    // buyer's catalog product must not grow.
    const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, business_id, is_active')
        .eq('id', productId)
        .maybeSingle();

    if (productError) throw new Error(productError.message);
    if (!product?.id || !product.business_id) {
        throw new Error('Product not found');
    }
    if (product.is_active === false) {
        throw new Error('Product is not available');
    }

    await assertNotOwnCatalogProduct(userId, String(product.business_id));

    const { data: existing, error: findError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

    if (findError) throw new Error(findError.message);

    if (existing) {
        const newQty = existing.quantity + quantity;
        const { data: updated, error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: newQty, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
            .select('*, product:products(*)')
            .single();

        if (updateError) throw new Error(updateError.message);
        return mapCartRowToDto(updated, await loadCartBusinesses([updated]));
    }

    // The cart may hold several sellers (ADR D9 applies at checkout, not here).
    const { data: inserted, error: insertError } = await supabase
        .from('cart_items')
        .insert({
            user_id: userId,
            product_id: productId,
            quantity,
        })
        .select('*, product:products(*)')
        .single();

    if (insertError) throw new Error(insertError.message);
    return mapCartRowToDto(inserted, await loadCartBusinesses([inserted]));
};

export const updateCartQty = async (
    userId: string,
    productId: string,
    quantity: number,
): Promise<CartItemDto | null> => {
    const supabase = getSupabaseAdmin();

    if (quantity <= 0) {
        await deleteCartItem(userId, productId);
        return null;
    }

    const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('product_id', productId)
        .select('*, product:products(*)')
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapCartRowToDto(data, await loadCartBusinesses([data])) : null;
};

export const deleteCartItem = async (userId: string, productId: string): Promise<void> => {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

    if (error) throw new Error(error.message);
};

/**
 * Removes only the given products. Checkout is per seller, so the lines a buyer
 * did not pay for must survive for a later order.
 */
export const removeCartProducts = async (
    userId: string,
    productIds: string[],
): Promise<void> => {
    const ids = [...new Set(productIds.filter((id) => Boolean(id)))];
    if (ids.length === 0) {
        return;
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .in('product_id', ids);

    if (error) throw new Error(error.message);
};

export const clearCart = async (userId: string): Promise<void> => {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
};
