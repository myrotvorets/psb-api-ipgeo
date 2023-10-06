import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, static as staticMiddleware } from 'express';
import { installOpenApiValidator } from '@myrotvorets/oav-installer';
import { errorMiddleware, notFoundMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { createServer } from '@myrotvorets/create-server';

import { recordErrorToSpan } from '@myrotvorets/opentelemetry-configurator';
import { initializeContainer, scopedContainerMiddleware } from './lib/container.mjs';
import { configurator } from './lib/otel.mjs';

import { loggerMiddleware } from './middleware/logger.mjs';

import { monitoringController } from './controllers/monitoring.mjs';
import { geoIPController } from './controllers/geoip.mjs';

export function configureApp(app: Express): Promise<ReturnType<typeof initializeContainer>> {
    return configurator
        .tracer()
        .startActiveSpan('configureApp', async (span): Promise<ReturnType<typeof initializeContainer>> => {
            try {
                const container = initializeContainer();
                const env = container.resolve('environment');
                const base = dirname(fileURLToPath(import.meta.url));

                app.use(scopedContainerMiddleware, loggerMiddleware);

                app.use('/monitoring', monitoringController());

                await installOpenApiValidator(join(base, 'specs', 'ipgeo-private.yaml'), app, env.NODE_ENV, {
                    ignorePaths: /^(\/$|\/specs\/)/u,
                });

                app.use(
                    '/specs/',
                    staticMiddleware(join(base, 'specs'), {
                        acceptRanges: false,
                        index: false,
                    }),
                );

                app.use(geoIPController(), notFoundMiddleware, errorMiddleware);
                span.end();
                return container;
            } /* c8 ignore start */ catch (e) {
                recordErrorToSpan(e, span);
                span.end();
                console.error(e);
                return process.exit(1);
            } /* c8 ignore stop */
        });
}

export function createApp(): Express {
    const app = express();
    app.set('strict routing', true);
    app.set('x-powered-by', false);
    app.set('trust proxy', true);
    return app;
}

/* c8 ignore start */
export async function run(): Promise<void> {
    const app = createApp();
    const container = await configureApp(app);
    const env = container.resolve('environment');

    const server = await createServer(app);
    server.listen(env.PORT);
}
/* c8 ignore stop */
