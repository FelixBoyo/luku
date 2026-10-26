import { getSupabaseAdmin } from '../data/supabaseAdmin';

export type OutfitPieceDto = {
    type: 'wardrobe' | 'product';
    id: string;
};

export type OutfitSourceDto = 'manual' | 'ai' | 'inspiration';

export type OutfitDto = {
    id: string;
    name: string;
    occasion: string;
    coverImageUrl: string;
    pieces: OutfitPieceDto[];
    source: OutfitSourceDto;
    createdAt: string;
};

// DB 'kind' column only has two real values in use: 'created' | 'inspiration'.
// Domain 'source' has a third value ('ai') reserved for M4 stylist features —
// not yet backed by a DB value, so it collapses to 'created' on write.
const kindToSource = (kind: string): OutfitSourceDto =>
    kind === 'inspiration' ? 'inspiration' : 'manual';

const sourceToKind = (source?: OutfitSourceDto): string =>
    source === 'inspiration' ? 'inspiration' : 'created';

const mapPieceRow = (row: Record<string, unknown>): OutfitPieceDto => {
    const pieceType = String(row.piece_type) as 'wardrobe' | 'product';
    const id = pieceType === 'wardrobe' ? String(row.wardrobe_item_id) : String(row.product_id);
    return { type: pieceType, id };
};

const getPiecesForOutfits = async (
    outfitIds: string[],
): Promise<Record<string, OutfitPieceDto[]>> => {
    if (outfitIds.length === 0) return {};
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('outfit_pieces')
        .select('outfit_id, wardrobe_item_id, product_id, piece_type, sort_order')
        .in('outfit_id', outfitIds)
        .order('sort_order', { ascending: true });

    if (error) throw new Error(error.message);

    const map: Record<string, OutfitPieceDto[]> = {};
    for (const row of data ?? []) {
        const typedRow = row as Record<string, unknown>;
        const outfitId = String(typedRow.outfit_id);
        if (!map[outfitId]) map[outfitId] = [];
        map[outfitId].push(mapPieceRow(typedRow));
    }
    return map;
};

const mapRowToDto = (row: Record<string, unknown>, pieces: OutfitPieceDto[]): OutfitDto => ({
    id: String(row.id),
    name: String(row.outfit_name),
    occasion: row.occasion != null ? String(row.occasion) : '',
    coverImageUrl: row.cover_image_url != null ? String(row.cover_image_url) : '',
    pieces,
    source: kindToSource(String(row.kind)),
    createdAt: String(row.created_at),
});

const insertPieces = async (outfitId: string, pieces: OutfitPieceDto[]): Promise<void> => {
    if (pieces.length === 0) return;
    const supabase = getSupabaseAdmin();
    const rows = pieces.map((p, idx) => ({
        outfit_id: outfitId,
        wardrobe_item_id: p.type === 'wardrobe' ? p.id : null,
        product_id: p.type === 'product' ? p.id : null,
        piece_type: p.type,
        sort_order: idx,
    }));
    const { error } = await supabase.from('outfit_pieces').insert(rows);
    if (error) throw new Error(error.message);
};

// GET outfits for a user, optionally filtered by kind ('created' | 'inspiration')
export const getOutfits = async (userId: string, kind?: string): Promise<OutfitDto[]> => {
    const supabase = getSupabaseAdmin();
    let query = supabase.from('outfits').select('*').eq('user_id', userId);
    if (kind) query = query.eq('kind', kind);
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const piecesMap = await getPiecesForOutfits(rows.map((r) => String((r as Record<string, unknown>).id)));
    return rows.map((row) => {
        const typedRow = row as Record<string, unknown>;
        return mapRowToDto(typedRow, piecesMap[String(typedRow.id)] ?? []);
    });
};

// GET single outfit
export const getOutfitById = async (id: string, userId: string): Promise<OutfitDto | null> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const piecesMap = await getPiecesForOutfits([id]);
    return mapRowToDto(data as Record<string, unknown>, piecesMap[id] ?? []);
};

// CREATE outfit (and its pieces)
export const createOutfit = async (
    userId: string,
    body: {
        name: string;
        occasion?: string;
        coverImageUrl?: string;
        pieces: OutfitPieceDto[];
        source?: OutfitSourceDto;
    },
): Promise<OutfitDto> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('outfits')
        .insert({
            user_id: userId,
            outfit_name: body.name,
            occasion: body.occasion ?? null,
            cover_image_url: body.coverImageUrl ?? null,
            kind: sourceToKind(body.source),
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    const row = data as Record<string, unknown>;
    const outfitId = String(row.id);
    await insertPieces(outfitId, body.pieces ?? []);

    return mapRowToDto(row, body.pieces ?? []);
};

// UPDATE outfit (replaces pieces wholesale when provided, for simplicity)
export const updateOutfit = async (
    id: string,
    userId: string,
    body: Partial<{
        name: string;
        occasion: string;
        coverImageUrl: string;
        pieces: OutfitPieceDto[];
    }>,
): Promise<OutfitDto | null> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('outfits')
        .update({
            ...(body.name && { outfit_name: body.name }),
            ...(body.occasion !== undefined && { occasion: body.occasion }),
            ...(body.coverImageUrl !== undefined && { cover_image_url: body.coverImageUrl }),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    if (!data) return null;

    if (body.pieces) {
        const { error: delError } = await supabase.from('outfit_pieces').delete().eq('outfit_id', id);
        if (delError) throw new Error(delError.message);
        await insertPieces(id, body.pieces);
    }

    const piecesMap = await getPiecesForOutfits([id]);
    return mapRowToDto(data as Record<string, unknown>, piecesMap[id] ?? []);
};

// DELETE outfit
export const deleteOutfit = async (id: string, userId: string): Promise<void> => {
    const supabase = getSupabaseAdmin();
    const { error: pieceError } = await supabase.from('outfit_pieces').delete().eq('outfit_id', id);
    if (pieceError) throw new Error(pieceError.message);

    const { error } = await supabase.from('outfits').delete().eq('id', id).eq('user_id', userId);
    if (error) throw new Error(error.message);
};