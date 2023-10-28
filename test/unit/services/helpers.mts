import type { CityResponse } from '../../../src/services/mmdbreaderserviceinterface.mjs';
import type { GeoResponse } from '../../../src/services/geoipserviceinterface.mjs';

export const emptyGeoResponse: GeoResponse = {
    cprefix: 0,
    iprefix: 0,
    cc: null,
    country: null,
    city: null,
    id: null,
    asn: null,
    asnOrg: null,
    org: null,
    isp: null,
};

const registeredCountry = {
    geoname_id: 1,
    iso_code: 'XX',
    names: {
        en: 'Sample Registered Country',
    },
};

const representedCountry = {
    geoname_id: 2,
    iso_code: 'YY',
    type: 'whatever',
    names: {
        en: 'Sample Represented Country',
    },
};

const country = {
    geoname_id: 3,
    iso_code: 'ZZ',
    names: {
        en: 'Sample Country',
    },
};

const city = {
    geoname_id: 4,
    names: {
        en: 'City',
    },
};

export const cityResponseWithRepresentedCountry: CityResponse = {
    registered_country: registeredCountry,
    represented_country: representedCountry,
    country,
    city,
};

export const geoResponseWithRepresentedCountry: GeoResponse = {
    cprefix: 32,
    iprefix: 0,
    cc: representedCountry.iso_code,
    country: representedCountry.names.en,
    city: city.names.en,
    id: city.geoname_id,
    asn: null,
    asnOrg: null,
    org: null,
    isp: null,
};

export const cityResponseWithCountry: CityResponse = {
    registered_country: registeredCountry,
    country,
    city,
};

export const geoResponseWithCountry: GeoResponse = {
    cprefix: 32,
    iprefix: 0,
    cc: country.iso_code,
    country: country.names.en,
    city: city.names.en,
    id: city.geoname_id,
    asn: null,
    asnOrg: null,
    org: null,
    isp: null,
};

export const cityResponseWithRegisteredCountry: CityResponse = {
    registered_country: registeredCountry,
    city,
};

export const geoResponseWithRegisteredCountry: GeoResponse = {
    cprefix: 32,
    iprefix: 0,
    cc: registeredCountry.iso_code,
    country: registeredCountry.names.en,
    city: city.names.en,
    id: city.geoname_id,
    asn: null,
    asnOrg: null,
    org: null,
    isp: null,
};
