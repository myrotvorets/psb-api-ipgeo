import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import { installOpenApiValidator } from '@myrotvorets/oav-installer';
import { errorMiddleware, notFoundMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { createServer } from '@myrotvorets/create-server';
import morgan from 'morgan';

import { environment } from './lib/environment.mjs';

import monitoringController from './controllers/monitoring.mjs';
import geoipController from './controllers/geoip.mjs';

export async function configureApp(app: Express): Promise<void> {
    const env = environment();

    await installOpenApiValidator(
        join(dirname(fileURLToPath(import.meta.url)), 'specs', 'ipgeo.yaml'),
        app,
        env.NODE_ENV,
    );
    app.use(await geoipController(), notFoundMiddleware, errorMiddleware);
}

/* istanbul ignore next */
export function setupApp(): Express {
    const app = express();
    app.set('strict routing', true);
    app.set('x-powered-by', false);
    app.set('trust proxy', true);

    app.use(
        morgan(
            '[PSBAPI-ipgeo] :req[X-Request-ID]\t:method\t:url\t:status :res[content-length]\t:date[iso]\t:response-time\t:total-time',
        ),
    );

    return app;
}

/* istanbul ignore next */
export async function run(): Promise<void> {
    const [env, app] = [environment(), setupApp()];

    app.use('/monitoring', monitoringController());

    await configureApp(app);

    const server = await createServer(app);
    server.listen(env.PORT);
}
