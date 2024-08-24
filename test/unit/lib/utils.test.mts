import { expect } from 'chai';
import { observe } from '../../../src/lib/utils.mjs';

describe('utils', function () {
    describe('observe', function () {
        it('should call the provided function with the provided arguments', function () {
            const args = ['hello', 42, true];
            let called = false;
            const fn = (...fnArgs: typeof args): void => {
                expect(fnArgs).to.deep.equal(args);
                called = true;
            };

            const result = observe(fn, ...args);
            expect(result).to.be.a('number');
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(called).to.be.true;
        });
    });
});
