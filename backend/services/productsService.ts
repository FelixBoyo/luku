import type { ProductDto, ProductListQuery } from '../../packages/contracts/src/products';
import type { PaginatedItems } from '../../packages/contracts/src/envelope';
import { getSupabaseAdmin } from '../data/supabaseAdmin';

type BusinessRow = {
    id: string;
    user_id: string;
    business_name: string | null;
    logo_url: string | null;
};

const businessCache = new Map<string, BusinessRow>();

export type SellerBusiness = BusinessRow;

export const loadBusinessMap = async (businessIds: string[]): Promise<Map<string, BusinessRow>> => {
    const missing = businessIds.filter((id) => !businessCache.has(id));
    if (missing.length > 0) {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
            .from('business_accounts')
            .select('id, user_id, business_name, logo_url')
            .in('id', missing);
        for (const row of (data ?? []) as BusinessRow[]) {
            businessCache.set(row.id, row);
        }
    }
    const map = new Map<string, BusinessRow>();
    for (const id of businessIds) {
        const row = businessCache.get(id);
        if (row) map.set(id, row);
    }
    return map;
};

const mapRowToDto = (row: Record<string, unknown>, business?: BusinessRow): ProductDto => ({
    id: String(row.id),
    name: String(row.name),
    description: row.description != null ? String(row.description) : null,
    price: Number(row.price),
    category: String(row.category),
    color: String(row.color),
    style: String(row.style),
    size: String(row.size),
    imageUrls: Array.isArray(row.image_urls)
        ? (row.image_urls as string[])
        : [],
    isFeatured: Boolean(row.is_featured),
    isActive: Boolean(row.is_active),
    averageRating: row.average_rating != null ? Number(row.average_rating) : null,
    reviewCount: row.review_count != null ? Number(row.review_count) : 0,
    stockQuantity: row.stock_quantity != null ? Number(row.stock_quantity) : undefined,
    businessId: String(row.business_id),
    sellerName: business?.business_name ?? undefined,
    sellerUserId: business?.user_id,
    sellerAvatarUrl: business?.logo_url ?? undefined,
});

const enrichProducts = async (rows: Record<string, unknown>[]): Promise<ProductDto[]> => {
    const businessIds = [...new Set(rows.map((row) => String(row.business_id)))];
    const businesses = await loadBusinessMap(businessIds);
    return rows.map((row) =>
        mapRowToDto(row, businesses.get(String(row.business_id))),
    );
};

export const listActiveProducts = async (
    query: ProductListQuery,
): Promise<PaginatedItems<ProductDto>> => {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const supabase = getSupabaseAdmin();

    try {
        const { data, error } = await supabase.rpc('search_products_paginated', {
            p_search_term: query.search ?? null,
            p_category: query.category ?? null,
            p_color: query.color ?? null,
            p_style: query.style ?? null,
            p_min_price: query.minPrice ?? null,
            p_max_price: query.maxPrice ?? null,
            p_page: page,
            p_page_size: limit,
        });

        if (!error && data) {
            const row = (Array.isArray(data) ? data[0] : data) as {
                products?: Record<string, unknown>[] | null;
                total_count?: number | string | null;
                total_pages?: number | string | null;
            } | null;

            if (row) {
                const productRows = Array.isArray(row.products) ? row.products : [];
                const items = await enrichProducts(productRows);
                const total = Number(row.total_count ?? items.length);
                const pages = Number(row.total_pages ?? (Math.ceil(total / limit) || 1));
                return {
                    items,
                    pagination: { page, limit, total, pages },
                };
            }
        }
    } catch {
        // fall through to simple query
    }

    const from = (page - 1) * limit;
    const { data: rows, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .range(from, from + limit - 1);

    if (error) throw new Error(error.message);

    const items = await enrichProducts((rows ?? []) as Record<string, unknown>[]);
    const total = count ?? items.length;
    return {
        items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    };
};

export const getProductById = async (id: string): Promise<ProductDto | null> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    const [item] = await enrichProducts([data as Record<string, unknown>]);
    return item ?? null;
};
