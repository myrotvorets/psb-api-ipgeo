import { type NextFunction, type Request, type Response, Router } from 'express';
import { type GeoResponse } from '../services/geoip.mjs';
import { type LocalsWithContainer } from '../lib/container.mjs';

interface GeolocateParams {
    ip: string;
}

interface CountryResponse {
    success: true;
    response: Pick<GeoResponse, 'cc' | 'country'>;
}

interface GeolocateResponse {
    success: true;
    response: GeoResponse;
}

function countryHandler(
    req: Request<never, CountryResponse, never, never, LocalsWithContainer>,
    res: Response<CountryResponse, LocalsWithContainer>,
    next: NextFunction,
): void {
    const service = res.locals.container.resolve('geoIPService');
    const response = service.geolocate(req.ip);
    res.header('Cache-Control', 'public, max-age=86400');
    res.json({
        success: true,
        response: {
            cc: response.cc,
            country: response.country,
        },
    });

    next();
}

function geolocateHandler(
    req: Request<GeolocateParams, GeolocateResponse, never, never>,
    res: Response<GeolocateResponse, LocalsWithContainer>,
    next: NextFunction,
): void {
    const service = res.locals.container.resolve('geoIPService');
    res.json({
        success: true,
        response: service.geolocate(req.params.ip),
    });

    next();
}

export function geoIPController(): Router {
    const router = Router({ strict: true });
    router.get('/country', countryHandler);
    router.get('/geolocate/:ip', geolocateHandler);
    return router;
}
