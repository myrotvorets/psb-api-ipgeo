import { use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { reset } from 'testdouble';

use(chaiAsPromised);

const env = { ...process.env };
process.env = {
    NODE_ENV: 'test',
    OTEL_SDK_DISABLED: 'true',
};

/** @type {import('mocha').RootHookObject} */
export const mochaHooks = {
    /** @returns {void} */
    afterEach() {
        reset();
    },
    afterAll() {
        process.env = { ...env };
    },
};
