import express from 'express';
import { join } from 'path';
import { installOpenApiValidator } from '@myrotvorets/oav-installer';
import { errorMiddleware, notFoundMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { createServer } from '@myrotvorets/create-server';
import morgan from 'morgan';

import { environment } from './lib/environment';

import monitoringController from './controllers/monitoring';
import geoipController from './controllers/geoip';

export async function configureApp(app: express.Express): Promise<void> {
    const env = environment();

    await installOpenApiValidator(join(__dirname, 'specs', 'ipgeo.yaml'), app, env.NODE_ENV);
    app.use(await geoipController(), notFoundMiddleware, errorMiddleware);
}

/* istanbul ignore next */
export function setupApp(): express.Express {
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
