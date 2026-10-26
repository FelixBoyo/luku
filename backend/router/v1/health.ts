import { Router, type Request, type Response } from 'express';
import { createResponse } from '../../lib/envelope';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
    res.json(createResponse({ status: 'ok' }, 'API healthy'));
});

export default router;
