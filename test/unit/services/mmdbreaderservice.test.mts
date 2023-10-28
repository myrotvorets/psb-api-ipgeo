import { expect } from 'chai';
import { MMDBReaderService } from '../../../src/services/mmdbreaderservice.mjs';

describe('MMDBReaderService', function () {
    describe('#geolocate()', function () {
        it('should work even without a database', function () {
            const reader = new MMDBReaderService();

            const expected = [null, 0];
            const actual = reader.getWithPrefixLength('0.0.0.0');

            expect(actual).to.deep.equal(expected);
        });
    });
});
