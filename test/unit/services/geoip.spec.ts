import { jest } from '@jest/globals';
import type { CityResponse, Reader } from 'maxmind';
import type { GeoIPService, GeoResponse } from '../../../src/services/geoip.mjs';
import {
    cityResponseWithCountry,
    cityResponseWithRegisteredCountry,
    cityResponseWithRepresentedCountry,
    emptyGeoResponse,
    geoResponseWithCountry,
    geoResponseWithRegisteredCountry,
    geoResponseWithRepresentedCountry,
} from './helpers';

const mockedMaxmindOpen = jest.fn<() => Promise<Reader<unknown>>>();
const mockedGetWithPrefixLength = jest.fn<(ip: string) => [unknown, number]>();
const mockedReader = function (_: Buffer): Reader<unknown> {
    return {
        getWithPrefixLength: mockedGetWithPrefixLength,
    } as unknown as Reader<unknown>;
};

jest.unstable_mockModule('maxmind', () => {
    return {
        open: mockedMaxmindOpen,
    };
});

await import('maxmind');
const geoip = await import('../../../src/services/geoip.mjs');

let service: GeoIPService;

beforeEach(() => {
    jest.resetAllMocks();
    service = new geoip.GeoIPService();
});

describe('GeoIPService', () => {
    describe('setCityDatabase()', () => {
        it('should not reject on maxmind failures', () => {
            mockedMaxmindOpen.mockRejectedValueOnce(new Error());
            return expect(service.setCityDatabase('blah')).resolves.toBeUndefined();
        });

        it('should accept empty values', () => {
            mockedMaxmindOpen.mockResolvedValueOnce(mockedReader(Buffer.from('')));
            return expect(service.setCityDatabase('')).resolves.toBeUndefined();
        });
    });

    describe('setIspDatabase()', () => {
        it('should not reject on maxmind failures', () => {
            mockedMaxmindOpen.mockRejectedValueOnce(new Error());
            return expect(service.setISPDatabase('blah')).resolves.toBeUndefined();
        });

        it('should accept empty values', () => {
            mockedMaxmindOpen.mockResolvedValueOnce(mockedReader(Buffer.from('')));
            return expect(service.setISPDatabase('')).resolves.toBeUndefined();
        });
    });

    describe('geolocate()', () => {
        beforeEach(() => {
            mockedMaxmindOpen.mockResolvedValue(mockedReader(Buffer.from('')));
            return Promise.all([service.setCityDatabase('blah'), service.setISPDatabase('blah')]);
        });

        it('should handle null responses', () => {
            mockedGetWithPrefixLength.mockImplementation(() => [null, 0]);
            const actual = service.geolocate('1.2.3.4');
            expect(actual).toStrictEqual(emptyGeoResponse);
        });

        it('should handle empty responses', () => {
            mockedGetWithPrefixLength.mockImplementation(() => [{}, 0]);
            const actual = service.geolocate('1.2.3.4');
            expect(actual).toStrictEqual(emptyGeoResponse);
        });

        it.each([
            [cityResponseWithRepresentedCountry, geoResponseWithRepresentedCountry],
            [cityResponseWithRegisteredCountry, geoResponseWithRegisteredCountry],
            [cityResponseWithCountry, geoResponseWithCountry],
        ])('should try records in the defined order', (mock: CityResponse, expected: GeoResponse) => {
            mockedGetWithPrefixLength.mockImplementationOnce(() => [mock, 32]);
            mockedGetWithPrefixLength.mockImplementationOnce(() => [null, 0]);
            const actual = service.geolocate('1.2.3.4');
            expect(actual).toStrictEqual(expected);
        });

        it('should return empty results with no databases', () => {
            return Promise.all([service.setCityDatabase(''), service.setISPDatabase('')]).then(() => {
                const actual = service.geolocate('1.2.3.4');
                expect(actual).toStrictEqual(emptyGeoResponse);
            });
        });
    });
});
