/* c8 ignore start */
import {
    OpenTelemetryConfigurator,
    getExpressInstrumentations,
    getFsInstrumentation,
} from '@myrotvorets/opentelemetry-configurator';
import { ValueType } from '@opentelemetry/api';

export const configurator = new OpenTelemetryConfigurator({
    serviceName: 'psb-api-ipgeo',
    instrumentations: [...getExpressInstrumentations(), getFsInstrumentation(true)],
});

configurator.start();

export const requestDurationHistogram = configurator.meter().createHistogram('psbapi.request.duration', {
    description: 'Measures the duration of requests.',
    unit: 'ms',
    valueType: ValueType.DOUBLE,
});

/* c8 ignore stop */
