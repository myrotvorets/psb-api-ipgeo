/* c8 ignore start */
import {
    OpenTelemetryConfigurator,
    getExpressInstrumentations,
    getFsInstrumentation,
} from '@myrotvorets/opentelemetry-configurator';

if (!+(process.env.ENABLE_TRACING || 0)) {
    process.env.OTEL_SDK_DISABLED = 'true';
}

process.env.OTEL_LOG_LEVEL = 'info';
process.env.OTEL_METRICS_EXPORTER = 'otlp';

export const configurator = new OpenTelemetryConfigurator({
    serviceName: 'psb-api-ipgeo',
    instrumentations: [...getExpressInstrumentations(), getFsInstrumentation(true)],
});

configurator.start();
/* c8 ignore stop */
