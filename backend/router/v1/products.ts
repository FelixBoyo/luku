import { Router, type Request, type Response } from 'express';
import type { ProductListQuery } from '../../../packages/contracts/src/products';
import { createResponse, createErrorResponse } from '../../lib/envelope';
import { listActiveProducts, getProductById } from '../../services/productsService';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const query: ProductListQuery = {
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 20,
            search: typeof req.query.search === 'string' ? req.query.search : undefined,
            category: typeof req.query.category === 'string' ? req.query.category : undefined,
            color: typeof req.query.color === 'string' ? req.query.color : undefined,
            style: typeof req.query.style === 'string' ? req.query.style : undefined,
            minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        };

        const result = await listActiveProducts(query);
        res.json(createResponse(result, 'Products retrieved'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to list products';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const product = await getProductById(req.params.id);
        if (!product) {
            res.status(404).json(createErrorResponse('Product not found', 404, 'ROUTE_NOT_FOUND'));
            return;
        }
        res.json(createResponse(product, 'Product retrieved'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch product';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

export default router;
