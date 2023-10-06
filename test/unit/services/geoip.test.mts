import { TestDouble, func, matchers, replaceEsm, when } from 'testdouble';
import { expect } from 'chai';
import type { Reader } from 'maxmind';
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
    let readFileSyncMock: TestDouble<typeof import('node:fs').readFileSync>;
    let constructorMock: TestDouble<(...args: unknown[]) => unknown>;
    let getWithPrefixLengthMock: TestDouble<typeof Reader.prototype.getWithPrefixLength>;

    before(function () {
        readFileSyncMock = func<typeof import('node:fs').readFileSync>();
        constructorMock = func<(...args: unknown[]) => unknown>();
        getWithPrefixLengthMock = func<typeof Reader.prototype.getWithPrefixLength>();
    });

    beforeEach(async function () {
        const fs = await import('node:fs');
        await replaceEsm('node:fs', {
            ...fs,
            readFileSync: readFileSyncMock,
        });

        await replaceEsm('maxmind', {
            Reader: class Reader {
                public constructor(...args: unknown[]) {
                    constructorMock(...args);
                }
                public getWithPrefixLength = getWithPrefixLengthMock;
            },
        });

        when(readFileSyncMock(matchers.isA(String) as string)).thenReturn(Buffer.from(''));

        geoip = await import('../../../src/services/geoip.mjs');
        service = new geoip.GeoIPService();
    });

    describe('setCityDatabase()', function () {
        it('should not reject on maxmind failures', function () {
            when(constructorMock(matchers.isA(Buffer))).thenThrow(new Error());
            return expect(service.setCityDatabase('blah')).to.be.false;
        });

        it('should accept empty values', function () {
            return expect(service.setCityDatabase('')).to.be.false;
        });
    });

    describe('setISPDatabase()', function () {
        it('should not reject on maxmind failures', function () {
            when(constructorMock(matchers.isA(Buffer))).thenThrow(new Error());
            return expect(service.setISPDatabase('blah')).to.be.false;
        });

        it('should accept empty values', function () {
            return expect(service.setISPDatabase('')).to.be.false;
        });
    });

    describe('geolocate()', function () {
        beforeEach(function () {
            service.setCityDatabase('blah');
            service.setISPDatabase('blah');
        });

        it('should handle null responses', function () {
            when(getWithPrefixLengthMock(matchers.isA(String) as string)).thenReturn([null, 0]);
            const actual = service.geolocate('1.2.3.4');
            expect(actual).to.deep.equal(emptyGeoResponse);
        });

        it('should handle empty responses', function () {
            when(getWithPrefixLengthMock(matchers.isA(String) as string)).thenReturn([{}, 0]);
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
                when(getWithPrefixLengthMock(matchers.isA(String) as string)).thenReturn([mock, 32], [null, 0]);
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
