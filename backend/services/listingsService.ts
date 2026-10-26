import { getSupabaseAdmin } from '../data/supabaseAdmin';

export type ListingDto = {
    id: string;
    sellerId: string;
    wardrobeItemId: string | null;
    productId: string | null;
    title: string;
    description: string | null;
    price: number;
    currency: string;
    category: string | null;
    size: string | null;
    condition: string | null;
    imageUrl: string;
    status: 'Active' | 'Draft' | 'Sold';
    viewCount: number;
    createdAt: string;
    updatedAt: string;
};

const mapRowToDto = (row: Record<string, unknown>): ListingDto => ({
    id: String(row.id),
    sellerId: String(row.seller_id),
    wardrobeItemId: row.wardrobe_item_id != null ? String(row.wardrobe_item_id) : null,
    productId: row.product_id != null ? String(row.product_id) : null,
    title: String(row.title),
    description: row.description != null ? String(row.description) : null,
    price: Number(row.price),
    currency: row.currency != null ? String(row.currency) : 'KES',
    category: row.category != null ? String(row.category) : null,
    size: row.size != null ? String(row.size) : null,
    condition: row.condition != null ? String(row.condition) : null,
    imageUrl: String(row.image_url),
    status: (row.status as ListingDto['status']) ?? 'Active',
    viewCount: Number(row.view_count ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
});

// GET all listings for a seller
export const getListings = async (sellerId: string): Promise<ListingDto[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRowToDto);
};

export const getListingsCountBySeller = async (sellerId: string): Promise<number> => {
    const supabase = getSupabaseAdmin();
    const { count, error } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .eq('status', 'Active');

    if (error) throw new Error(error.message);
    return count ?? 0;
};

// GET single listing
export const getListingById = async (
    id: string,
    sellerId: string,
): Promise<ListingDto | null> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('seller_id', sellerId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapRowToDto(data as Record<string, unknown>);
};

// CREATE listing
export const createListing = async (
    sellerId: string,
    body: {
        title: string;
        description?: string;
        price: number;
        currency?: string;
        category?: string;
        size?: string;
        condition?: string;
        imageUrl: string;
        wardrobeItemId?: string;
        status?: 'Active' | 'Draft' | 'Sold';
    },
): Promise<ListingDto> => {
    const supabase = getSupabaseAdmin();

    if (body.wardrobeItemId) {
        const { data: existing } = await supabase
            .from('listings')
            .select('id')
            .eq('seller_id', sellerId)
            .eq('wardrobe_item_id', body.wardrobeItemId)
            .eq('status', 'Active')
            .maybeSingle();
        if (existing) {
            throw new Error('This item already has an active listing.');
        }
    }

    const { data, error } = await supabase
        .from('listings')
        .insert({
            seller_id: sellerId,
            wardrobe_item_id: body.wardrobeItemId ?? null,
            title: body.title,
            description: body.description ?? null,
            price: body.price,
            currency: body.currency ?? 'KES',
            category: body.category ?? null,
            size: body.size ?? null,
            condition: body.condition ?? null,
            image_url: body.imageUrl,
            status: body.status ?? 'Active',
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return mapRowToDto(data as Record<string, unknown>);
};

// UPDATE listing (also used for status changes: sold / pause / draft / active)
export const updateListing = async (
    id: string,
    sellerId: string,
    body: Partial<{
        title: string;
        description: string;
        price: number;
        category: string;
        size: string;
        condition: string;
        imageUrl: string;
        status: 'Active' | 'Draft' | 'Sold';
    }>,
): Promise<ListingDto | null> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('listings')
        .update({
            ...(body.title && { title: body.title }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.price !== undefined && { price: body.price }),
            ...(body.category && { category: body.category }),
            ...(body.size && { size: body.size }),
            ...(body.condition && { condition: body.condition }),
            ...(body.imageUrl && { image_url: body.imageUrl }),
            ...(body.status && { status: body.status }),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('seller_id', sellerId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapRowToDto(data as Record<string, unknown>);
};

// DELETE listing
export const deleteListing = async (id: string, sellerId: string): Promise<void> => {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)
        .eq('seller_id', sellerId);

    if (error) throw new Error(error.message);
};