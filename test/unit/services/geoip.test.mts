import { beforeEach, describe, it } from 'mocha';
import * as td from 'testdouble';
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

describe('GeoIPService', () => {
    let geoip: typeof import('../../../src/services/geoip.mjs');
    let service: GeoIPService;

    const mockedMaxmindOpen = td.function();
    const mockedGetWithPrefixLength = td.function();

    beforeEach(async () => {
        td.replace('maxmind', {
            open: mockedMaxmindOpen,
        });
        geoip = await import('../../../src/services/geoip.mjs');

        service = new geoip.GeoIPService();
    });

    describe('setCityDatabase()', () => {
        it('should not reject on maxmind failures', () => {
            td.when(mockedMaxmindOpen(td.matchers.anything(), td.matchers.anything())).thenReject(new Error());
            return expect(service.setCityDatabase('blah')).to.eventually.be.false;
        });

        it('should accept empty values', () => {
            td.when(mockedMaxmindOpen(td.matchers.anything(), td.matchers.anything())).thenResolve({
                getWithPrefixLength: mockedGetWithPrefixLength,
            });
            return expect(service.setCityDatabase('')).to.eventually.be.false;
        });
    });

    describe('setISPDatabase()', () => {
        it('should not reject on maxmind failures', () => {
            td.when(mockedMaxmindOpen(td.matchers.anything(), td.matchers.anything())).thenReject(new Error());
            return expect(service.setISPDatabase('blah')).to.eventually.be.false;
        });

        it('should accept empty values', () => {
            td.when(mockedMaxmindOpen(td.matchers.anything(), td.matchers.anything())).thenResolve({
                getWithPrefixLength: mockedGetWithPrefixLength,
            });
            return expect(service.setISPDatabase('')).to.eventually.be.false;
        });
    });

    describe('geolocate()', () => {
        beforeEach(() => {
            td.when(mockedMaxmindOpen(td.matchers.anything(), td.matchers.anything())).thenResolve({
                getWithPrefixLength: mockedGetWithPrefixLength,
            });

            return Promise.all([service.setCityDatabase('blah'), service.setISPDatabase('blah')]);
        });

        it('should handle null responses', () => {
            td.when(mockedGetWithPrefixLength(td.matchers.anything())).thenReturn([null, 0]);
            const actual = service.geolocate('1.2.3.4');
            expect(actual).to.deep.equal(emptyGeoResponse);
        });

        it('should handle empty responses', () => {
            td.when(mockedGetWithPrefixLength(td.matchers.anything())).thenReturn([{}, 0]);
            const actual = service.geolocate('1.2.3.4');
            expect(actual).to.deep.equal(emptyGeoResponse);
        });

        [
            [cityResponseWithRepresentedCountry, geoResponseWithRepresentedCountry],
            [cityResponseWithRegisteredCountry, geoResponseWithRegisteredCountry],
            [cityResponseWithCountry, geoResponseWithCountry],
        ].forEach(([mock, expected]) => {
            it('should try records in the defined order', () => {
                td.when(mockedGetWithPrefixLength(td.matchers.anything())).thenReturn([mock, 32], [null, 0]);
                const actual = service.geolocate('1.2.3.4');
                expect(actual).to.deep.equal(expected);
            });
        });

        it('should return empty results with no databases', () => {
            return Promise.all([service.setCityDatabase(''), service.setISPDatabase('')]).then(() => {
                const actual = service.geolocate('1.2.3.4');
                expect(actual).to.deep.equal(emptyGeoResponse);
            });
        });
    });
});
