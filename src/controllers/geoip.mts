import { type NextFunction, type Request, type Response, Router } from 'express';
import type { GeoResponse } from '../services/geoipserviceinterface.mjs';
import type { LocalsWithContainer } from '../lib/container.mjs';

interface GeolocateParams {
    ip: string;
}

interface GeolocateResponse {
    success: true;
    response: GeoResponse;
}

function geolocateHandler(
    req: Request<GeolocateParams, GeolocateResponse, never, never>,
    res: Response<GeolocateResponse, LocalsWithContainer>,
    next: NextFunction,
): void {
    const service = res.locals.container.resolve('geoIPService');
    res.header('Cache-Control', 'public, max-age=86400');
    res.json({
        success: true,
        response: service.geolocate(req.params.ip),
    });

    next();
}

export function geoIPController(): Router {
    const router = Router({ strict: true, caseSensitive: true });
    router.get('/geolocate/:ip', geolocateHandler);
    return router;
}
