import { type Tracer, recordErrorToSpan } from '@myrotvorets/otel-utils';
import { trace } from '@opentelemetry/api';
import { cityLookupHistogram, countryCounter, ispLookupHistogram } from '../lib/metrics.mjs';
import { observe } from '../lib/utils.mjs';
import { GeoIPService, type GeoIPServiceOptions } from './geoipservice.mjs';
import type { GeoCityResponse, GeoIspResponse, GeoResponse } from './geoipserviceinterface.mjs';

interface MeteredGeoIPServiceOptions extends GeoIPServiceOptions {
    tracer: Tracer;
}

export class MeteredGeoIPService extends GeoIPService {
    private readonly _tracer: Tracer;

    public constructor(opts: MeteredGeoIPServiceOptions) {
        super(opts);
        this._tracer = opts.tracer;
    }

    public override geolocate(ip: string): GeoResponse {
        return this._tracer.startActiveSpan(`geolocate ${ip}`, (span): GeoResponse => {
            try {
                return super.geolocate(ip);
            } /* c8 ignore start */ catch (e) {
                throw recordErrorToSpan(e, span);
            } /* c8 ignore stop */ finally {
                span.end();
            }
        });
    }

    protected override geolocateCity(ip: string): ReturnType<GeoIPService['geolocateCity']> {
        let result: ReturnType<GeoIPService['geolocateCity']> = [null, 0];

        cityLookupHistogram.record(
            observe(() => {
                result = super.geolocateCity(ip);
            }),
        );

        return result;
    }

    protected override geolocateISP(ip: string): ReturnType<GeoIPService['geolocateISP']> {
        let result: ReturnType<GeoIPService['geolocateISP']> = [null, 0];

        ispLookupHistogram.record(
            observe(() => {
                result = super.geolocateISP(ip);
            }),
        );

        return result;
    }

    protected override adaptCityResponse(...params: Parameters<GeoIPService['adaptCityResponse']>): GeoCityResponse {
        const result = super.adaptCityResponse(...params);
        trace
            .getActiveSpan()
            /* c8 ignore next */
            ?.addEvent(`GeoIP/City: Country: ${result.country ?? 'N/A'}, city: ${result.city ?? 'N/A'}`);

        countryCounter.add(1, { country: result.cc ?? 'ZZ' });
        return result;
    }

    protected override adaptIspResponse(...params: Parameters<GeoIPService['adaptIspResponse']>): GeoIspResponse {
        const result = super.adaptIspResponse(...params);
        trace
            .getActiveSpan()
            /* c8 ignore start */
            ?.addEvent(
                `GeoIP/ISP: ASN: ${result.asn ?? 'N/A'}, ISP: ${result.isp ?? 'N/A'}, Org: ${result.org ?? 'N/A '}`,
            );
        /* c8 ignore stop */

        return result;
    }
}
