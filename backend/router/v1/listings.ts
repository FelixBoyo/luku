import { Router, type Response } from 'express';
import { createResponse, createErrorResponse } from '../../lib/envelope';
import { type AuthenticatedRequest, verifyToken } from '../../middleware/auth';
import {
    getListings,
    getListingById,
    createListing,
    updateListing,
    deleteListing,
} from '../../services/listingsService';

const router = Router();

router.use(verifyToken);

// GET /v1/api/listings
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const sellerId = req.userId!;
        const listings = await getListings(sellerId);
        res.json(createResponse(listings, 'Listings retrieved'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch listings';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

// GET /v1/api/listings/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const listing = await getListingById(req.params.id, req.userId!);
        if (!listing) {
            res.status(404).json(createErrorResponse('Listing not found', 404, 'ROUTE_NOT_FOUND'));
            return;
        }
        res.json(createResponse(listing, 'Listing retrieved'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch listing';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

// POST /v1/api/listings
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const listing = await createListing(req.userId!, req.body);
        res.status(201).json(createResponse(listing, 'Listing created'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create listing';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

// PUT /v1/api/listings/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const listing = await updateListing(req.params.id, req.userId!, req.body);
        if (!listing) {
            res.status(404).json(createErrorResponse('Listing not found', 404, 'ROUTE_NOT_FOUND'));
            return;
        }
        res.json(createResponse(listing, 'Listing updated'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update listing';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

// DELETE /v1/api/listings/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        await deleteListing(req.params.id, req.userId!);
        res.json(createResponse(null, 'Listing deleted'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete listing';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

export default router;