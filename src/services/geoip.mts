import { type CityResponse, type IspResponse, Reader, open } from 'maxmind';

export interface GeoCityResponse {
    cc: string | null;
    country: string | null;
    city: string | null;
    id: number | null;
}

export interface GeoIspResponse {
    asn: number | null;
    asnOrg: string | null;
    isp: string | null;
    org: string | null;
}

export interface GeoPrefixes {
    cprefix: number;
    iprefix: number;
}

export type GeoResponse = GeoCityResponse & GeoIspResponse & GeoPrefixes;

export class GeoIPService {
    private _city: Reader<CityResponse> | undefined;
    private _isp: Reader<IspResponse> | undefined;

    public async setCityDatabase(file: string): Promise<boolean> {
        if (file) {
            try {
                this._city = await open<CityResponse>(file, { watchForUpdates: false });
                return true;
            } catch {
                /* Do nothing */
            }
        }

        this._city = undefined;
        return false;
    }

    public async setISPDatabase(file: string): Promise<boolean> {
        if (file) {
            try {
                this._isp = await open<IspResponse>(file, { watchForUpdates: false });
                return true;
            } catch {
                /* Do nothing */
            }
        }

        this._isp = undefined;
        return false;
    }

    public geolocate(ip: string): GeoResponse {
        const [city, cprefix] = this._city ? this._city.getWithPrefixLength(ip) : [{} as CityResponse, 0];
        const [isp, iprefix] = this._isp ? this._isp.getWithPrefixLength(ip) : [{} as IspResponse, 0];

        return {
            cprefix,
            iprefix,
            ...GeoIPService.adaptCityResponse(city),
            ...GeoIPService.adaptIspResponse(isp),
        };
    }

    protected static adaptCityResponse(response: CityResponse | null): GeoCityResponse {
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
                response.represented_country?.iso_code ||
                response.country?.iso_code ||
                response.registered_country?.iso_code ||
                null;

            country =
                response.represented_country?.names.en ||
                response.country?.names.en ||
                response.registered_country?.names.en ||
                null;

            id =
                response.city?.geoname_id ||
                response.represented_country?.geoname_id ||
                response.country?.geoname_id ||
                response.registered_country?.geoname_id ||
                null;

            city = response.city?.names.en || null;
        }

        return { cc, country, city, id };
    }

    protected static adaptIspResponse(response: IspResponse | null): GeoIspResponse {
        const {
            autonomous_system_number: asn = null,
            autonomous_system_organization: asnOrg = null,
            isp = null,
            organization: org = null,
        } = response ?? {};

        return { asn, asnOrg, isp, org };
    }
}
