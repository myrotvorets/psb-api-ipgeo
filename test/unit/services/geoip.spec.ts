import * as maxmind from 'maxmind';
import { CityResponse } from 'maxmind';
import { GeoIPService, GeoResponse } from '../../../src/services/geoip';
import {
    cityResponseWithCountry,
    cityResponseWithRegisteredCountry,
    cityResponseWithRepresentedCountry,
    emptyGeoResponse,
    geoResponseWithCountry,
    geoResponseWithRegisteredCountry,
    geoResponseWithRepresentedCountry,
} from './helpers';

jest.mock('maxmind');

let service: GeoIPService;
const mockedMaxmindOpen = maxmind.open as jest.MockedFunction<typeof maxmind.open>;
const mockedReader = maxmind.Reader as jest.MockedClass<typeof maxmind.Reader>;
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockedGetWithPrefixLength = mockedReader.prototype.getWithPrefixLength as jest.MockedFunction<
    typeof mockedReader.prototype.getWithPrefixLength
>;

beforeEach(() => {
    jest.resetAllMocks();
    service = new GeoIPService();
});

describe('GeoIPService', () => {
    describe('setCityDatabase()', () => {
        it('should not reject on maxmind failures', () => {
            mockedMaxmindOpen.mockRejectedValueOnce(new Error());
            return expect(service.setCityDatabase('blah')).resolves.toBeUndefined();
        });

        it('should accept empty values', () => {
            mockedMaxmindOpen.mockResolvedValueOnce(new mockedReader(Buffer.from('')));
            return expect(service.setCityDatabase('')).resolves.toBeUndefined();
        });
    });

    describe('setIspDatabase()', () => {
        it('should not reject on maxmind failures', () => {
            mockedMaxmindOpen.mockRejectedValueOnce(new Error());
            return expect(service.setISPDatabase('blah')).resolves.toBeUndefined();
        });

        it('should accept empty values', () => {
            mockedMaxmindOpen.mockResolvedValueOnce(new mockedReader(Buffer.from('')));
            return expect(service.setISPDatabase('')).resolves.toBeUndefined();
        });
    });

    describe('geolocate()', () => {
        beforeEach(() => {
            mockedMaxmindOpen.mockResolvedValue(new mockedReader(Buffer.from('')));
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
