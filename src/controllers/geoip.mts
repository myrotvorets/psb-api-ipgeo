import { type RequestHandler, Router } from 'express';
import { GeoIPService, type GeoResponse } from '../services/geoip.mjs';
import { environment } from '../lib/environment.mjs';

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

function countryHandler(service: GeoIPService): RequestHandler<never, CountryResponse, never, never> {
    return (req, res): void => {
        const response = service.geolocate(req.ip);
        res.header('Cache-Control', 'public, max-age=86400');
        res.json({
            success: true,
            response: {
                cc: response.cc,
                country: response.country,
            },
        });
    };
}

function geolocateHandler(service: GeoIPService): RequestHandler<GeolocateParams, GeolocateResponse, never, never> {
    return (req, res): void => {
        res.json({
            success: true,
            response: service.geolocate(req.params.ip),
        });
    };
}

export async function geoIPController(): Promise<Router> {
    const env = environment();
    const service = new GeoIPService();
    await Promise.all([service.setCityDatabase(env.GEOIP_CITY_FILE), service.setISPDatabase(env.GEOIP_ISP_FILE)]);

    const router = Router({ strict: true });
    router.get('/country', countryHandler(service));
    router.get('/geolocate/:ip', geolocateHandler(service));
    return router;
}
