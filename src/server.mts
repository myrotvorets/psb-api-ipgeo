import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, static as staticMiddleware } from 'express';
import { installOpenApiValidator } from '@myrotvorets/oav-installer';
import { errorMiddleware, notFoundMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { createServer } from '@myrotvorets/create-server';
import morgan from 'morgan';

import { environment } from './lib/environment.mjs';

import { monitoringController } from './controllers/monitoring.mjs';
import { geoIPController } from './controllers/geoip.mjs';

export async function configureApp(app: Express): Promise<void> {
    const env = environment();
    const base = dirname(fileURLToPath(import.meta.url));

    await installOpenApiValidator(join(base, 'specs', 'ipgeo-private.yaml'), app, env.NODE_ENV, {
        ignorePaths: /^(\/$|\/specs\/)/u,
        fileUploader: false,
    });

    app.use(
        '/specs/',
        staticMiddleware(join(base, 'specs'), {
            acceptRanges: false,
            index: false,
        }),
    );

    /* c8 ignore start */
    if (process.env.HAVE_SWAGGER === 'true') {
        app.get('/', (_req, res) => res.redirect('/swagger/'));
    }
    /* c8 ignore stop */

    app.use(await geoIPController(), notFoundMiddleware, errorMiddleware);
}

/* c8 ignore start */
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

export async function run(): Promise<void> {
    const [env, app] = [environment(), setupApp()];

    app.use('/monitoring', monitoringController());

    await configureApp(app);

    const server = await createServer(app);
    server.listen(env.PORT);
}
/* c8 ignore stop */
