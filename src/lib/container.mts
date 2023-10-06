import { AwilixContainer, asFunction, asValue, createContainer } from 'awilix';
import type { NextFunction, Request, Response } from 'express';
import { GeoIPService } from '../services/geoip.mjs';
import { environment } from './environment.mjs';
import { configurator } from './otel.mjs';

export interface Container {
    geoIPService: GeoIPService;
    environment: ReturnType<typeof environment>;
    logger: ReturnType<(typeof configurator)['logger']>;
}

export interface RequestContainer {
    req: Request;
}

export const container = createContainer<Container>();

function createEnvironment(): ReturnType<typeof environment> {
    return environment(true);
}

function createLogger({ req }: RequestContainer): ReturnType<(typeof configurator)['logger']> {
    const logger = configurator.logger();
    logger.clearAttributes();
    logger.setAttribute('ip', req.ip);
    logger.setAttribute('req-id', req.get('X-Request-ID') ?? '');
    logger.setAttribute('request', `${req.method} ${req.url}`);
    return logger;
}

function createGeoIPService({ environment: env }: Container): GeoIPService {
    const service = new GeoIPService();
    service.setCityDatabase(env.GEOIP_CITY_FILE);
    service.setISPDatabase(env.GEOIP_ISP_FILE);
    return service;
}

export type LocalsWithContainer = Record<'container', AwilixContainer<RequestContainer & Container>>;

export function initializeContainer(): typeof container {
    container.register({
        geoIPService: asFunction(createGeoIPService).singleton(),
        environment: asFunction(createEnvironment).singleton(),
        logger: asFunction(createLogger).scoped(),
    });

    return container;
}

export function scopedContainerMiddleware(
    req: Request,
    res: Response<unknown, LocalsWithContainer>,
    next: NextFunction,
): void {
    res.locals.container = container.createScope<RequestContainer>();
    res.locals.container.register({
        req: asValue(req),
    });

    next();
}