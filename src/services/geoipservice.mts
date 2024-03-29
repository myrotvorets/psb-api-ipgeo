import type { GeoCityResponse, GeoIPServiceInterface, GeoIspResponse, GeoResponse } from './geoipserviceinterface.mjs';
import type { CityResponse, IspResponse, MMDBReaderServiceInterface } from './mmdbreaderserviceinterface.mjs';

export interface GeoIPServiceOptions {
    cityReader: MMDBReaderServiceInterface<CityResponse>;
    ispReader: MMDBReaderServiceInterface<IspResponse>;
}

export class GeoIPService implements GeoIPServiceInterface {
    protected _city: MMDBReaderServiceInterface<CityResponse>;
    protected _isp: MMDBReaderServiceInterface<IspResponse>;

    public constructor({ cityReader, ispReader }: GeoIPServiceOptions) {
        this._city = cityReader;
        this._isp = ispReader;
    }

    public geolocate(ip: string): GeoResponse {
        const [city, cprefix] = this.geolocateCity(ip);
        const [isp, iprefix] = this.geolocateISP(ip);

        return {
            cprefix,
            iprefix,
            ...this.adaptCityResponse(city),
            ...this.adaptIspResponse(isp),
        };
    }

    protected geolocateCity(ip: string): [CityResponse | null, number] {
        return this._city.getWithPrefixLength(ip);
    }

    protected geolocateISP(ip: string): [IspResponse | null, number] {
        return this._isp.getWithPrefixLength(ip);
    }

    protected adaptCityResponse(response: CityResponse | null): GeoCityResponse {
        let cc: string | null = null,
            country: string | null = null,
            city: string | null = null,
            id: number | null = null;

        if (response) {
            // The `country` is the country where the IP address is located.
            // The `registered_country` is the country in which the IP is registered.
            // When the IP address belongs to something like a military base,
            // the `represented_country` is the country that the base represents.

            cc =
                response.represented_country?.iso_code ??
                response.country?.iso_code ??
                response.registered_country?.iso_code ??
                null;

            country =
                response.represented_country?.names.en ??
                response.country?.names.en ??
                response.registered_country?.names.en ??
                null;

            id =
                response.city?.geoname_id /* c8 ignore start */ ??
                response.represented_country?.geoname_id ??
                response.country?.geoname_id ??
                response.registered_country?.geoname_id ??
                /* c8 ignore stop */
                null;

            city = response.city?.names.en ?? null;
        }

        return { cc, country, city, id };
    }

    protected adaptIspResponse(response: IspResponse | null): GeoIspResponse {
        const {
            autonomous_system_number: asn = null,
            autonomous_system_organization: asnOrg = null,
            isp = null,
            organization: org = null,
        } = response ?? {};

        return { asn, asnOrg, isp, org };
    }
}
