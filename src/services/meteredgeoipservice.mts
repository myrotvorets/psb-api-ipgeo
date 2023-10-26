import type { CityResponse, IspResponse } from 'maxmind';
import { type Tracer, recordErrorToSpan } from '@myrotvorets/otel-utils';
import { trace } from '@opentelemetry/api';
import { cityLookupHistogram, countryCounter, ispLookupHistogram } from '../lib/metrics.mjs';
import { observe } from '../lib/utils.mjs';
import { GeoIPService } from './geoipservice.mjs';
import type { GeoCityResponse, GeoIspResponse, GeoResponse } from './geoipserviceinterface.mjs';

interface MeteredGeoIPServiceOptions {
    tracer: Tracer;
}
export class MeteredGeoIPService extends GeoIPService {
    private readonly _tracer: Tracer;

    public constructor({ tracer }: MeteredGeoIPServiceOptions) {
        super();
        this._tracer = tracer;
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

    protected override geolocateCity(ip: string): [CityResponse | null, number] {
        let city: CityResponse | null = null;
        let prefix = 0;

        cityLookupHistogram.record(
            observe(() => {
                [city, prefix] = super.geolocateCity(ip);
            }),
        );

        return [city, prefix];
    }

    protected override geolocateISP(ip: string): [IspResponse | null, number] {
        let isp: IspResponse | null = null;
        let prefix = 0;

        ispLookupHistogram.record(
            observe(() => {
                [isp, prefix] = super.geolocateISP(ip);
            }),
        );

        return [isp, prefix];
    }

    protected override adaptCityResponse(response: CityResponse | null): GeoCityResponse {
        const result = super.adaptCityResponse(response);
        trace
            .getActiveSpan()
            /* c8 ignore next */
            ?.addEvent(`GeoIP/City: Country: ${result.country ?? 'N/A'}, city: ${result.city ?? 'N/A'}`);

        countryCounter.add(1, { country: result.cc ?? 'ZZ' });
        return result;
    }

    protected override adaptIspResponse(response: IspResponse | null): GeoIspResponse {
        const result = super.adaptIspResponse(response);
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
