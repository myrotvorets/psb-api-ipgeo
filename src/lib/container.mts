import { AwilixContainer, asFunction, asValue, createContainer } from 'awilix';
import type { NextFunction, Request, Response } from 'express';
import { type Logger, getLogger } from '@myrotvorets/otel-utils';
import { environment } from './environment.mjs';
import { MeteredGeoIPService } from '../services/meteredgeoipservice.mjs';
import { GeoIPServiceInterface } from '../services/geoipserviceinterface.mjs';

export interface Container {
    geoIPService: GeoIPServiceInterface;
    environment: ReturnType<typeof environment>;
    logger: Logger;
}

export interface RequestContainer {
    req: Request;
}

export const container = createContainer<Container>();

function createEnvironment(): ReturnType<typeof environment> {
    return environment(true);
}

/* c8 ignore start */
function createLogger({ req }: RequestContainer): Logger {
    const logger = getLogger();
    logger.clearAttributes();
    if (req.ip) {
        logger.setAttribute('ip', req.ip);
    }

    logger.setAttribute('request', `${req.method} ${req.url}`);
    return logger;
}
/* c8 ignore stop */

function createGeoIPService({ environment }: Container): GeoIPServiceInterface {
    const service = new MeteredGeoIPService();
    service.setCityDatabase(environment.GEOIP_CITY_FILE);
    service.setISPDatabase(environment.GEOIP_ISP_FILE);
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
