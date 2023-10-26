/* c8 ignore start */
import { ValueType } from '@opentelemetry/api';
import { getMeter } from '@myrotvorets/otel-utils';

const meter = getMeter();

export const requestDurationHistogram = meter.createHistogram('psbapi.request.duration', {
    description: 'Measures the duration of requests.',
    unit: 'ms',
    valueType: ValueType.DOUBLE,
});

export const cityLookupHistogram = meter.createHistogram('psbapi.geolocate.city.duration', {
    description: 'Measures the duration of city lookups.',
    unit: 'us',
    valueType: ValueType.DOUBLE,
});

export const ispLookupHistogram = meter.createHistogram('psbapi.geolocate.isp.duration', {
    description: 'Measures the duration of ISP lookups.',
    unit: 'us',
    valueType: ValueType.DOUBLE,
});

export const countryCounter = meter.createCounter('psbapi.geolocate.country', {
    description: 'Number of lookups by country',
    unit: '{count}',
    valueType: ValueType.INT,
});

/* c8 ignore stop */
