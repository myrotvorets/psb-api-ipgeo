/* c8 ignore start */
import { OpenTelemetryConfigurator } from '@myrotvorets/opentelemetry-configurator';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

if (!+(process.env.ENABLE_TRACING || 0)) {
    process.env.OTEL_SDK_DISABLED = 'true';
}

const configurator = new OpenTelemetryConfigurator({
    serviceName: 'psb-api-ipgeo',
    instrumentations: [new ExpressInstrumentation(), new HttpInstrumentation()],
});

configurator.start();
/* c8 ignore stop */
