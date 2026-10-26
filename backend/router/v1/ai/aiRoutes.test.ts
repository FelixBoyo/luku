import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import aiRouter from './index';
import { getOotd } from '../../../ai/tasks/ootd';
import { getRecommendations } from '../../../ai/tasks/recommendations';
import { getWardrobePairings } from '../../../ai/tasks/wardrobePairings';
import { getOutfitSuggestions } from '../../../ai/tasks/outfitSuggestions';

vi.mock('../../../middleware/auth', () => ({
    verifyToken: (req: any, _res: any, next: NextFunction) => {
        req.userId = req.headers.authorization ? 'user_test_123' : undefined;
        next();
    },
}));

vi.mock('../../../ai/tasks/ootd', () => ({
    getOotd: vi.fn().mockResolvedValue({
        ootd: {
            id: 'ootd-1',
            date: '2026-10-20',
            title: 'Daily Look',
            description: 'Minimal chic',
            occasion: 'Casual',
            coverImageUrl: 'cover.jpg',
            pieces: [],
            matchScore: 95,
        },
    }),
}));

vi.mock('../../../ai/tasks/recommendations', () => ({
    getRecommendations: vi.fn().mockResolvedValue({
        pickedForYou: { id: 'rec-1', productId: 'p1', title: 'Silk Shirt', price: 3000, imageUrl: 'shirt.jpg', matchPercentage: 98 },
        trending: [],
        youMightLike: [],
        moreForYou: [],
    }),
}));

vi.mock('../../../ai/tasks/wardrobePairings', () => ({
    getWardrobePairings: vi.fn().mockResolvedValue({
        pairings: [
            {
                id: 'pairing-1',
                wardrobeItemId: 'w1',
                wardrobeItemName: 'Leather Jacket',
                wardrobeItemCategory: 'Outerwear',
                wardrobeItemImageUrl: 'jacket.jpg',
                pairedProductId: 'p1',
                pairedProductTitle: 'White Tee',
                pairedProductImageUrl: 'tee.jpg',
                pairedProductPrice: 1500,
                matchPercentage: 96,
                pairingReason: 'Timeless combination',
            },
        ],
    }),
}));

vi.mock('../../../ai/tasks/outfitSuggestions', () => ({
    getOutfitSuggestions: vi.fn().mockResolvedValue({
        suggestions: [
            {
                id: 'sug-1',
                name: 'Modern Casual',
                occasion: 'Casual',
                coverImageUrl: 'outfit.jpg',
                pieces: [],
                matchScore: 92,
            },
        ],
    }),
}));

const mockRes = () => {
    const res: Partial<Response> & { statusCode?: number; body?: unknown } = {};
    res.status = vi.fn((code: number) => {
        res.statusCode = code;
        return res as Response;
    });
    res.json = vi.fn((body: unknown) => {
        res.body = body;
        return res as Response;
    });
    return res as Response & { statusCode?: number; body?: any };
};

const findRoute = (router: any, path: string, method: string): any => {
    for (const layer of router.stack) {
        if (layer.route && layer.route.path === path && layer.route.methods?.[method]) {
            return layer.route;
        }
        if (layer.name === 'router' && layer.handle?.stack) {
            const nested = findRoute(layer.handle, path, method);
            if (nested) return nested;
        }
    }
    return null;
};

const invoke = (
    method: 'get' | 'post',
    path: string,
    req: Partial<Request>,
): Promise<Response & { statusCode?: number; body?: any }> => {
    const route = findRoute(aiRouter, path, method);
    if (!route) {
        throw new Error(`No ${method.toUpperCase()} ${path} found on aiRouter`);
    }
    const res = mockRes();
    return new Promise((resolve, reject) => {
        const finish = () => resolve(res);
        res.json = vi.fn((body: unknown) => {
            res.body = body;
            finish();
            return res;
        });
        const handlers = route.stack.map((s: any) => s.handle);
        const run = (index: number) => {
            const handler = handlers[index];
            if (!handler) {
                finish();
                return;
            }
            const next: NextFunction = (err?: unknown) => {
                if (err) {
                    reject(err);
                    return;
                }
                run(index + 1);
            };
            try {
                const result = handler(req as Request, res, next);
                if (result && typeof result.then === 'function') {
                    result.then(() => undefined).catch(reject);
                }
            } catch (err) {
                reject(err);
            }
        };
        run(0);
    });
};

describe('v1 AI Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /ootd', () => {
        it('rejects unauthenticated requests with 401', async () => {
            const res = await invoke('get', '/ootd', { headers: {}, query: {} });
            expect(res.status).toHaveBeenCalledWith(401);
            expect(getOotd).not.toHaveBeenCalled();
        });

        it('returns outfit of the day envelope when authenticated', async () => {
            const res = await invoke('get', '/ootd', {
                headers: { authorization: 'Bearer test' },
                query: { refresh: 'true' },
            });
            expect(getOotd).toHaveBeenCalledWith('user_test_123', { refresh: true, weather: undefined });
            expect(res.body.data.ootd.title).toBe('Daily Look');
            expect(res.body.status).toBe('success');
        });
    });

    describe('GET /recommendations', () => {
        it('returns recommendations envelope when authenticated', async () => {
            const res = await invoke('get', '/recommendations', {
                headers: { authorization: 'Bearer test' },
                query: {},
            });
            expect(getRecommendations).toHaveBeenCalledWith('user_test_123', expect.any(Object));
            expect(res.body.data.pickedForYou.title).toBe('Silk Shirt');
            expect(res.body.status).toBe('success');
        });
    });

    describe('GET /wardrobe-pairings', () => {
        it('returns wardrobe pairings envelope when authenticated', async () => {
            const res = await invoke('get', '/wardrobe-pairings', {
                headers: { authorization: 'Bearer test' },
                query: {},
            });
            expect(getWardrobePairings).toHaveBeenCalledWith('user_test_123');
            expect(res.body.data.pairings[0].pairingReason).toBe('Timeless combination');
            expect(res.body.status).toBe('success');
        });
    });

    describe('POST /outfit-suggestions', () => {
        it('returns outfit suggestions tailored to request prompt description', async () => {
            const res = await invoke('post', '/outfit-suggestions', {
                headers: { authorization: 'Bearer test' },
                body: { occasion: 'Cocktail', description: 'Sophisticated monochrome look' },
            });
            expect(getOutfitSuggestions).toHaveBeenCalledWith('user_test_123', {
                occasion: 'Cocktail',
                description: 'Sophisticated monochrome look',
            });
            expect(res.body.data.suggestions[0].name).toBe('Modern Casual');
            expect(res.body.status).toBe('success');
        });
    });
});
