import { Router, type Response } from 'express';
import { randomUUID } from 'crypto';
import { createResponse, createErrorResponse } from '../../lib/envelope';
import { type AuthenticatedRequest, verifyToken } from '../../middleware/auth';
import { getSupabaseAdmin } from '../../data/supabaseAdmin';

const router = Router();
router.use(verifyToken);

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

const resolveSupabaseUrl = (): string => {
    const projectId = process.env.SUPABASE_PROJECT_ID;
    return (
        process.env.SUPABASE_URL ??
        process.env.VITE_SUPABASE_URL ??
        (projectId ? `https://${projectId}.supabase.co` : '')
    );
};

// POST /v1/api/uploads/wardrobe-images/sign
router.post('/wardrobe-images/sign', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { filename, contentType, context } = req.body as {
            filename?: string;
            contentType?: string;
            context?: 'wardrobe' | 'listings';
        };

        if (!filename || !contentType) {
            res.status(400).json(createErrorResponse(
                'filename and contentType are required', 400, 'VALIDATION_FAILED',
            ));
            return;
        }
        if (!ALLOWED_TYPES.includes(contentType)) {
            res.status(400).json(createErrorResponse(
                `contentType must be one of: ${ALLOWED_TYPES.join(', ')}`, 400, 'VALIDATION_FAILED',
            ));
            return;
        }

        // Path satisfies RLS: foldername[1] = auth.uid()
        // Listings get a 'listings' subfolder segment to satisfy the dedicated listing-images policy
        const folder = context === 'listings'
            ? `${userId}/listings/${randomUUID()}`
            : `${userId}/${randomUUID()}`;
        const path = `${folder}/${filename}`;

        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.storage
            .from('wardrobe-images')
            .createSignedUploadUrl(path);

        if (error || !data) throw new Error(error?.message ?? 'Failed to create signed URL');

        const supabaseUrl = resolveSupabaseUrl();
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/wardrobe-images/${path}`;

        res.json(createResponse({ signedUrl: data.signedUrl, path, publicUrl }, 'Signed URL created'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create signed URL';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

export default router;