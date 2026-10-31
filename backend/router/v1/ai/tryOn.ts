import { Router, type Response } from 'express';

import {
    createResponse,
    createErrorResponse,
} from '../../../lib/envelope';

import {
    verifyToken,
    type AuthenticatedRequest,
} from '../../../middleware/auth';

import {
    uploadImage,
    startTryOn,
    getTryOn,
} from '../../../services/youcam';

import {
    getWardrobeItemById,
} from '../../../services/wardrobeService';

import {
    getProductById,
} from '../../../services/productsService';

const router = Router();

const DAILY_LIMIT = 10;

const usage = new Map<string, {
    day: string;
    count: number;
}>();

const resultCache = new Map<string, string>();

type TryOnSource = 'wardrobe' | 'marketplace';

type TryOnItem = {
    id: string;
    name: string;
    imageUrl: string | null;
    category: string;
};

/**
 * Daily usage limiter
 */
const underLimit = (userId: string): boolean => {
    const day = new Date().toISOString().slice(0, 10);

    const u = usage.get(userId);

    if (!u || u.day !== day) {
        usage.set(userId, {
            day,
            count: 1,
        });

        return true;
    }

    if (u.count >= DAILY_LIMIT) {
        return false;
    }

    u.count += 1;

    return true;
};

/**
 * Retrieve an item from the wardrobe.
 */
const getWardrobeTryOnItem = async (
    itemId: string,
    userId: string,
): Promise<TryOnItem | null> => {

    const item = await getWardrobeItemById(
        itemId,
        userId,
    );

    if (!item) {
        return null;
    }

    return {
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl ?? null,
        category: item.category ?? '',
    };
};

/**
 * Retrieve an active marketplace product.
 */
const getMarketplaceTryOnItem = async (
    itemId: string,
): Promise<TryOnItem | null> => {

    const product = await getProductById(itemId);

    if (!product) {
        return null;
    }

    return {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrls?.find(
            (url) => typeof url === 'string' && url.trim().length > 0,
        ) ?? null,
        category: product.category,
    };
};

/**
 * Start virtual try-on.
 */
router.post(
    '/try-on',
    verifyToken,
    async (req: AuthenticatedRequest, res: Response) => {

        if (!req.userId) {
            res.status(401).json(
                createErrorResponse(
                    'Unauthorized',
                    401,
                ),
            );
            return;
        }

        const {
            itemId,
            photoBase64,
            source,
        } = req.body as {
            itemId?: string;
            photoBase64?: string;
            source?: TryOnSource;
        };

        // Validate request.
        if (!itemId || !photoBase64 || !source) {
            res.status(400).json(
                createErrorResponse(
                    'itemId, photoBase64 and source are required',
                    400,
                ),
            );
            return;
        }

        if (
            source !== 'wardrobe' &&
            source !== 'marketplace'
        ) {
            res.status(400).json(
                createErrorResponse(
                    'Invalid item source',
                    400,
                ),
            );
            return;
        }

        try {

            let item: TryOnItem | null = null;

            // 1. Retrieve the selected item.
            if (source === 'wardrobe') {

                item = await getWardrobeTryOnItem(
                    itemId,
                    req.userId,
                );

            } else if (source === 'marketplace') {

                item = await getMarketplaceTryOnItem(
                    itemId,
                );
            }

            // 2. Ensure the item exists.
            if (!item) {
                res.status(404).json(
                    createErrorResponse(
                        'Selected item not found',
                        404,
                    ),
                );
                return;
            }

            // 3. Ensure the item has an image.
            if (!item.imageUrl) {
                res.status(400).json(
                    createErrorResponse(
                        'Selected item has no image',
                        400,
                    ),
                );
                return;
            }

            console.log('[TRY-ON] Item retrieved:', {
                source,
                itemId: item.id,
                name: item.name,
                category: item.category,
                hasImage: !!item.imageUrl,
            });

            // 4. Check daily usage.
            if (!underLimit(req.userId)) {
                res.status(429).json(
                    createErrorResponse(
                        'Daily try-on limit reached',
                        429,
                    ),
                );
                return;
            }

            // 5. Convert Base64 photo to a buffer.
            const base64 = photoBase64.replace(
                /^data:image\/\w+;base64,/,
                '',
            );

            const buf = Buffer.from(
                base64,
                'base64',
            );

            if (!buf.length) {
                res.status(400).json(
                    createErrorResponse(
                        'Invalid uploaded photo',
                        400,
                    ),
                );
                return;
            }

            // 6. Upload user's photo to YouCam.
            const fileId = await uploadImage(buf);

            // 7. Start virtual try-on.
            const taskId = await startTryOn(
                fileId,
                item.imageUrl,
                item.category,
            );

            console.log('[TRY-ON] Task started:', {
                taskId,
                source,
                itemId: item.id,
            });

            res.json(
                createResponse(
                    { taskId },
                    'Try-on started',
                ),
            );

        } catch (e: any) {

            console.error(
                '[TRY-ON] Failed:',
                e,
            );

            res.status(500).json(
                createErrorResponse(
                    e.message || 'Try-on failed',
                ),
            );
        }
    },
);

/**
 * Check virtual try-on status.
 */
router.get(
    '/try-on/:taskId',
    verifyToken,
    async (req: AuthenticatedRequest, res: Response) => {

        try {

            const taskId = String(req.params.taskId);

            // Check cached result.
            const cached = resultCache.get(taskId);

            if (cached) {
                res.json(
                    createResponse(
                        {
                            status: 'success',
                            imageDataUri: cached,
                        },
                        'Try-on ready',
                    ),
                );
                return;
            }

            // Retrieve task status from YouCam.
            const r = await getTryOn(taskId);

            if (r.status === 'success' && r.url) {

                const img = await fetch(r.url);

                if (!img.ok) {
                    throw new Error(
                        'Could not download try-on result',
                    );
                }

                const uri =
                    `data:image/jpeg;base64,${Buffer.from(
                        await img.arrayBuffer(),
                    ).toString('base64')}`;

                resultCache.set(taskId, uri);

                res.json(
                    createResponse(
                        {
                            status: 'success',
                            imageDataUri: uri,
                        },
                        'Try-on ready',
                    ),
                );

                return;
            }

            res.json(
                createResponse(
                    {
                        status: r.status,
                        error: r.error,
                    },
                    'Try-on status',
                ),
            );

        } catch (e: any) {

            console.error(
                '[TRY-ON] Status failed:',
                e,
            );

            res.status(500).json(
                createErrorResponse(
                    e.message || 'Try-on status failed',
                ),
            );
        }
    },
);

export default router;