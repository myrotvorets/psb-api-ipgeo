import { TestDouble, func, matchers, replaceEsm, when } from 'testdouble';
import type * as mm from 'maxmind';
import { expect } from 'chai';
import type { GeoIPService } from '../../../src/services/geoip.mjs';
import {
    cityResponseWithCountry,
    cityResponseWithRegisteredCountry,
    cityResponseWithRepresentedCountry,
    emptyGeoResponse,
    geoResponseWithCountry,
    geoResponseWithRegisteredCountry,
    geoResponseWithRepresentedCountry,
} from './helpers.mjs';

describe('GeoIPService', function () {
    let geoip: typeof import('../../../src/services/geoip.mjs');
    let service: GeoIPService;
    let mockedMaxmindOpen: TestDouble<typeof mm.open>;
    let mockedGetWithPrefixLength: TestDouble<typeof mm.Reader.prototype.getWithPrefixLength>;

    before(function () {
        mockedMaxmindOpen = func<typeof mm.open>();
        mockedGetWithPrefixLength = func<typeof mm.Reader.prototype.getWithPrefixLength>();
    });

    beforeEach(async function () {
        await replaceEsm('maxmind', {
            open: mockedMaxmindOpen,
        });

        geoip = await import('../../../src/services/geoip.mjs');
        service = new geoip.GeoIPService();
    });

    describe('setCityDatabase()', function () {
        it('should not reject on maxmind failures', function () {
            when(mockedMaxmindOpen(matchers.isA(String) as string, matchers.anything() as mm.OpenOpts)).thenReject(
                new Error(),
            );

            return expect(service.setCityDatabase('blah')).to.eventually.be.false;
        });

        it('should accept empty values', function () {
            when(mockedMaxmindOpen(matchers.isA(String) as string, matchers.anything() as mm.OpenOpts)).thenResolve({
                getWithPrefixLength: mockedGetWithPrefixLength,
            });

            return expect(service.setCityDatabase('')).to.eventually.be.false;
        });
    });

    describe('setISPDatabase()', function () {
        it('should not reject on maxmind failures', function () {
            when(mockedMaxmindOpen(matchers.isA(String) as string, matchers.anything() as mm.OpenOpts)).thenReject(
                new Error(),
            );

            return expect(service.setISPDatabase('blah')).to.eventually.be.false;
        });

        it('should accept empty values', function () {
            when(mockedMaxmindOpen(matchers.isA(String) as string, matchers.anything() as mm.OpenOpts)).thenResolve({
                getWithPrefixLength: mockedGetWithPrefixLength,
            });

            return expect(service.setISPDatabase('')).to.eventually.be.false;
        });
    });

    describe('geolocate()', function () {
        beforeEach(function () {
            when(mockedMaxmindOpen(matchers.isA(String) as string, matchers.anything() as mm.OpenOpts)).thenResolve({
                getWithPrefixLength: mockedGetWithPrefixLength,
            });

            return Promise.all([service.setCityDatabase('blah'), service.setISPDatabase('blah')]);
        });

        it('should handle null responses', function () {
            when(mockedGetWithPrefixLength(matchers.isA(String) as string)).thenReturn([null, 0]);
            const actual = service.geolocate('1.2.3.4');
            expect(actual).to.deep.equal(emptyGeoResponse);
        });

        it('should handle empty responses', function () {
            when(mockedGetWithPrefixLength(matchers.isA(String) as string)).thenReturn([{}, 0]);
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
                when(mockedGetWithPrefixLength(matchers.isA(String) as string)).thenReturn([mock, 32], [null, 0]);
                const actual = service.geolocate('1.2.3.4');
                expect(actual).to.deep.equal(expected);
            });
        });

        it('should return empty results with no databases', function () {
            return Promise.all([service.setCityDatabase(''), service.setISPDatabase('')]).then(() => {
                const actual = service.geolocate('1.2.3.4');
                expect(actual).to.deep.equal(emptyGeoResponse);
            });
        });
    });
});
