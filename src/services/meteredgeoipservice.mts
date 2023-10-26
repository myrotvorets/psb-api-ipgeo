import type { CityResponse, IspResponse } from 'maxmind';
import { trace } from '@opentelemetry/api';
import { cityLookupHistogram, ispLookupHistogram } from '../lib/metrics.mjs';
import { observe } from '../lib/utils.mjs';
import { GeoIPService } from './geoip.mjs';
import type { GeoCityResponse, GeoIspResponse } from './geoipserviceinterface.mjs';

export class MeteredGeoIPService extends GeoIPService {
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
