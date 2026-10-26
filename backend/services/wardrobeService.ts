import { getSupabaseAdmin } from '../data/supabaseAdmin';

export type WardrobeItemDto = {
    id: string;
    userId: string;
    name: string;
    category: string;
    brand: string;
    color: string;
    size: string;
    condition: string;
    description: string | null;
    imageUrl: string;
    imageUrls: string[];
    purchasePrice: number;
    wearCount: number;
    source: 'manual' | 'purchase';
    createdAt: string;
    updatedAt: string;
};

const mapRowToDto = (row: Record<string, unknown>): WardrobeItemDto => ({
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    category: String(row.category),
    brand: String(row.brand),
    color: String(row.color),
    size: String(row.size),
    condition: String(row.condition),
    description: row.description != null ? String(row.description) : null,
    imageUrl: String(row.image_url),
    imageUrls: Array.isArray(row.image_urls) ? (row.image_urls as string[]) : [],
    purchasePrice: Number(row.purchase_price),
    wearCount: Number(row.wear_count),
    source: (row.source as 'manual' | 'purchase') ?? 'manual',
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
});

// GET all items for a user
export const getWardrobeItems = async (userId: string): Promise<WardrobeItemDto[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRowToDto);
};

export type WearLogEntryDto = {
    date: string;
    occasion: string | null;
};

const getWearHistory = async (itemId: string, userId: string): Promise<WearLogEntryDto[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('wardrobe_wear_log')
        .select('occasion, worn_on')
        .eq('wardrobe_item_id', itemId)
        .eq('user_id', userId)
        .order('worn_on', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
        date: String(row.worn_on),
        occasion: row.occasion != null ? String(row.occasion) : null,
    }));
};

// GET single item
export const getWardrobeItemById = async (
    id: string,
    userId: string,
): Promise<(WardrobeItemDto & { wearHistory: WearLogEntryDto[] }) | null> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const wearHistory = await getWearHistory(id, userId);
    return { ...mapRowToDto(data as Record<string, unknown>), wearHistory };
};

// CREATE item
export const createWardrobeItem = async (
    userId: string,
    body: {
        name: string;
        category: string;
        brand: string;
        color: string;
        size: string;
        condition: string;
        description?: string;
        imageUrl: string;
        imageUrls?: string[];
        purchasePrice?: number;
        source?: 'manual' | 'purchase';
    },
): Promise<WardrobeItemDto> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('wardrobe_items')
        .insert({
            user_id: userId,
            name: body.name,
            category: body.category,
            brand: body.brand,
            color: body.color,
            size: body.size,
            condition: body.condition,
            description: body.description ?? null,
            image_url: body.imageUrl,
            image_urls: body.imageUrls ?? [body.imageUrl],
            purchase_price: body.purchasePrice ?? 0,
            source: body.source ?? 'manual',
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return mapRowToDto(data as Record<string, unknown>);
};

// UPDATE item
export const updateWardrobeItem = async (
    id: string,
    userId: string,
    body: Partial<{
        name: string;
        category: string;
        brand: string;
        color: string;
        size: string;
        condition: string;
        description: string;
        imageUrl: string;
        imageUrls: string[];
        purchasePrice: number;
    }>,
): Promise<WardrobeItemDto | null> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('wardrobe_items')
        .update({
            ...(body.name && { name: body.name }),
            ...(body.category && { category: body.category }),
            ...(body.brand && { brand: body.brand }),
            ...(body.color && { color: body.color }),
            ...(body.size && { size: body.size }),
            ...(body.condition && { condition: body.condition }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.imageUrl && { image_url: body.imageUrl }),
            ...(body.imageUrls && { image_urls: body.imageUrls }),
            ...(body.purchasePrice !== undefined && { purchase_price: body.purchasePrice }),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapRowToDto(data as Record<string, unknown>);
};

// DELETE item
export const deleteWardrobeItem = async (id: string, userId: string): Promise<void> => {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
        .from('wardrobe_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
};

// LOG WEAR
export const logWear = async (id: string, userId: string, occasion?: string): Promise<void> => {
    const supabase = getSupabaseAdmin();

    // increment wear_count
    const { error: wearError } = await supabase.rpc('increment_wear_count', {
        item_id: id,
        p_user_id: userId,
    });

    // fallback if rpc doesn't exist
    if (wearError) {
        const { data: item } = await supabase
            .from('wardrobe_items')
            .select('wear_count')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        await supabase
            .from('wardrobe_items')
            .update({ wear_count: (Number(item?.wear_count) ?? 0) + 1 })
            .eq('id', id)
            .eq('user_id', userId);
    }

    // log to wear_log table
    const { error: logError } = await supabase.from('wardrobe_wear_log').insert({
        wardrobe_item_id: id,
        user_id: userId,
        occasion: occasion ?? null,
        worn_on: new Date().toISOString().split('T')[0],   // 'worn_on' is a date column, not 'worn_at'
    });

    if (logError) {
        console.error('[logWear] Failed to insert wear log entry:', logError.message, logError);
    }
};