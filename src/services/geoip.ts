import maxmind, { CityResponse, IspResponse, Reader } from 'maxmind';

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

    public setCityDatabase(file: string): Promise<void> {
        if (file) {
            return maxmind
                .open<CityResponse>(file, { watchForUpdates: false })
                .then((reader): void => {
                    this._city = reader;
                })
                .catch(() => {
                    this._city = undefined;
                });
        }

        this._city = undefined;
        return Promise.resolve();
    }

    public setISPDatabase(file: string): Promise<void> {
        if (file) {
            return maxmind
                .open<IspResponse>(file, { watchForUpdates: false })
                .then((reader): void => {
                    this._isp = reader;
                })
                .catch(() => {
                    this._isp = undefined;
                });
        }

        this._isp = undefined;
        return Promise.resolve();
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

            if (typeof response.represented_country !== 'undefined') {
                cc = response.represented_country.iso_code;
                country = response.represented_country.names.en;
                id = response.represented_country.geoname_id;
            } else if (typeof response.country !== 'undefined') {
                cc = response.country.iso_code;
                country = response.country.names.en;
                id = response.country.geoname_id;
            } else if (typeof response.registered_country !== 'undefined') {
                // ! This is probably a dead branch. So far, so far, I was unable to find a record with registered_country and without country
                cc = response.registered_country.iso_code;
                country = response.registered_country.names.en;
                id = response.registered_country.geoname_id;
            }

            if (typeof response.city !== 'undefined') {
                city = response.city.names.en;
                id = response.city.geoname_id;
            }
        }

        return { cc, country, city, id };
    }

    protected static adaptIspResponse(response: IspResponse | null): GeoIspResponse {
        const {
            autonomous_system_number: asn = null,
            autonomous_system_organization: asnOrg = null,
            isp = null,
            organization: org = null,
        } = response || {};

        return { asn, asnOrg, isp, org };
    }
}
