import { EventEmitter } from 'events';
import { describe, expect, it, vi } from 'vitest';
import { createRequestTimingMiddleware, SLOW_REQUEST_MS } from './request-timing';

const setup = () => {
    let clock = 1_000;
    const logger = { info: vi.fn(), warn: vi.fn() };
    const middleware = createRequestTimingMiddleware(logger, () => clock);
    const req = { method: 'POST', originalUrl: '/v1/api/orders/ord_1/confirm?token=secret' } as any;
    const res = Object.assign(new EventEmitter(), {
        statusCode: 200,
        locals: { requestId: 'rid_1' },
    }) as any;
    const next = vi.fn();
    middleware(req, res, next);
    return {
        logger,
        res,
        next,
        advance: (ms: number) => {
            clock += ms;
        },
    };
};

describe('createRequestTimingMiddleware', () => {
    it('logs method, path without query, status and duration on finish', () => {
        const { logger, res, next, advance } = setup();
        expect(next).toHaveBeenCalledOnce();

        advance(120);
        res.emit('finish');
        res.emit('close');

        expect(logger.info).toHaveBeenCalledWith(
            '[HTTP] POST /v1/api/orders/ord_1/confirm 200 120ms rid=rid_1'
        );
        expect(logger.warn).not.toHaveBeenCalled();
    });

    it('warns when a request takes longer than the slow threshold', () => {
        const { logger, res, advance } = setup();
        advance(SLOW_REQUEST_MS + 1);
        res.emit('finish');

        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('(slow)'));
        expect(logger.info).not.toHaveBeenCalled();
    });

    it('warns when the connection closes before any response', () => {
        const { logger, res, advance } = setup();
        advance(20_000);
        res.emit('close');

        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('(closed before a response was sent)')
        );
    });
});
