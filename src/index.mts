/* c8 ignore start */
import {
    OpenTelemetryConfigurator,
    getExpressInstrumentations,
    getFsInstrumentation,
} from '@myrotvorets/opentelemetry-configurator';
import { initProcessMetrics } from '@myrotvorets/otel-utils';

process.env['OTEL_SERVICE_NAME'] = 'psb-api-ipgeo';

export const configurator = new OpenTelemetryConfigurator({
    serviceName: process.env['OTEL_SERVICE_NAME'],
    instrumentations: [...getExpressInstrumentations(), getFsInstrumentation(true)],
});

configurator.start();

await initProcessMetrics();

try {
    const { run } = await import('./server.mjs');
    await run();
} catch (e) {
    console.error(e);
}
/* c8 ignore stop */
