import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, type Request, type Response } from 'express';
import { installOpenApiValidator } from '@myrotvorets/oav-installer';
import { errorMiddleware, notFoundMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { createServer, getTracer, recordErrorToSpan } from '@myrotvorets/otel-utils';
import {
    type LoggerFromRequestFunction,
    errorLoggerHook,
    requestDurationMiddleware,
    requestLoggerMiddleware,
} from '@myrotvorets/express-otel-middlewares';

import { type LocalsWithContainer, initializeContainer, scopedContainerMiddleware } from './lib/container.mjs';
import { requestDurationHistogram } from './lib/metrics.mjs';

import { monitoringController } from './controllers/monitoring.mjs';
import { geoIPController } from './controllers/geoip.mjs';

const loggerFromRequest: LoggerFromRequestFunction = (req: Request) =>
    (req.res as Response<never, LocalsWithContainer> | undefined)?.locals.container.resolve('logger');

export function configureApp(app: Express): ReturnType<typeof initializeContainer> {
    return getTracer().startActiveSpan('configureApp', (span): ReturnType<typeof initializeContainer> => {
        try {
            const container = initializeContainer();
            const env = container.resolve('environment');
            const base = dirname(fileURLToPath(import.meta.url));

            app.use(
                requestDurationMiddleware(requestDurationHistogram),
                scopedContainerMiddleware,
                requestLoggerMiddleware('ipgeo', loggerFromRequest),
            );

            app.use('/monitoring', monitoringController());

            app.use(
                installOpenApiValidator(join(base, 'specs', 'ipgeo-private.yaml'), env.NODE_ENV),
                geoIPController(),
                notFoundMiddleware,
                errorMiddleware({
                    beforeSendHook: errorLoggerHook(loggerFromRequest),
                }),
            );
            return container;
        } /* c8 ignore start */ catch (e) {
            recordErrorToSpan(e, span);
            throw e;
        } /* c8 ignore stop */ finally {
            span.end();
        }
    });
}

export function createApp(): Express {
    const app = express();
    app.set('strict routing', true);
    app.set('case sensitive routing', true);
    app.set('x-powered-by', false);
    app.set('trust proxy', true);
    return app;
}

/* c8 ignore start */
export async function run(): Promise<void> {
    const app = createApp();
    configureApp(app);
    await createServer(app);
}
/* c8 ignore stop */
