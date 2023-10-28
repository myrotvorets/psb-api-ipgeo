import { expect } from 'chai';
import { mock } from 'node:test';
import { GeoIPService } from '../../../src/services/geoipservice.mjs';
import type { CityResponse, IspResponse } from '../../../src/services/mmdbreaderserviceinterface.mjs';
import {
    cityResponseWithCountry,
    cityResponseWithRegisteredCountry,
    cityResponseWithRepresentedCountry,
    emptyGeoResponse,
    geoResponseWithCountry,
    geoResponseWithRegisteredCountry,
    geoResponseWithRepresentedCountry,
} from './helpers.mjs';
import { FakeMMDBReader } from './fakemmdbreader.mjs';

describe('GeoIPService', function () {
    let service: GeoIPService;
    let cityReader: FakeMMDBReader<CityResponse>;
    let ispReader: FakeMMDBReader<IspResponse>;

    before(function () {
        cityReader = new FakeMMDBReader();
        ispReader = new FakeMMDBReader();
        service = new GeoIPService({ cityReader, ispReader });
    });

    afterEach(function () {
        mock.reset();
    });

    describe('#geolocate()', function () {
        it('should handle null responses', function () {
            const actual = service.geolocate('1.2.3.4');
            expect(actual).to.deep.equal(emptyGeoResponse);
        });

        it('should handle empty responses', function () {
            cityReader.getWithPrefixLength.mock.mockImplementationOnce(() => [{}, 0]);
            ispReader.getWithPrefixLength.mock.mockImplementationOnce(() => [{}, 0]);
            const actual = service.geolocate('1.2.3.4');
            expect(actual).to.deep.equal(emptyGeoResponse);
        });

        // eslint-disable-next-line mocha/no-setup-in-describe
        [
            [cityResponseWithRepresentedCountry, geoResponseWithRepresentedCountry],
            [cityResponseWithRegisteredCountry, geoResponseWithRegisteredCountry],
            [cityResponseWithCountry, geoResponseWithCountry],
        ].forEach(([mock, expected]) => {
            it('should try records in the defined order', function () {
                cityReader.getWithPrefixLength.mock.mockImplementationOnce(() => [mock, 32]);
                const actual = service.geolocate('1.2.3.4');
                expect(actual).to.deep.equal(expected);
            });
        });
    });
});
