import { readFileSync } from 'node:fs';
import { AwilixContainer, asClass, asFunction, asValue, createContainer } from 'awilix';
import type { NextFunction, Request, Response } from 'express';
import { type Logger, type Tracer, getLogger, getTracer } from '@myrotvorets/otel-utils';
import { environment } from './environment.mjs';
import type { GeoIPServiceInterface } from '../services/geoipserviceinterface.mjs';
import type { CityResponse, IspResponse, MMDBReaderServiceInterface } from '../services/mmdbreaderserviceinterface.mjs';
import { MeteredGeoIPService } from '../services/meteredgeoipservice.mjs';
import { MMDBReaderService } from '../services/mmdbreaderservice.mjs';

export interface Container {
    geoIPService: GeoIPServiceInterface;
    environment: ReturnType<typeof environment>;
    tracer: Tracer;
    logger: Logger;
    cityReader: MMDBReaderServiceInterface<CityResponse>;
    ispReader: MMDBReaderServiceInterface<IspResponse>;
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

function createTracer(): Tracer {
    return getTracer();
}

function createCityReader({ environment }: Container): MMDBReaderServiceInterface<CityResponse> {
    const reader = new MMDBReaderService<CityResponse>();
    const buf = readFileSync(environment.GEOIP_CITY_FILE);
    reader.load(buf);
    return reader;
}

function createIspReader({ environment }: Container): MMDBReaderServiceInterface<IspResponse> {
    const reader = new MMDBReaderService<IspResponse>();
    const buf = readFileSync(environment.GEOIP_ISP_FILE);
    reader.load(buf);
    return reader;
}

export type LocalsWithContainer = Record<'container', AwilixContainer<RequestContainer & Container>>;

export function initializeContainer(): typeof container {
    container.register({
        geoIPService: asClass(MeteredGeoIPService).singleton(),
        environment: asFunction(createEnvironment).singleton(),
        logger: asFunction(createLogger).scoped(),
        tracer: asFunction(createTracer).singleton(),
        cityReader: asFunction(createCityReader).singleton(),
        ispReader: asFunction(createIspReader).singleton(),
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
