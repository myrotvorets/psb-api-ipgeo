import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

const base = dirname(fileURLToPath(import.meta.url));
const env = { ...process.env };
process.env = {
    NODE_ENV: 'test',
    OTEL_SDK_DISABLED: 'true',
    GEOIP_CITY_FILE: join(base, 'test', 'fixtures', 'GeoIP2-City-Test.mmdb'),
    GEOIP_ISP_FILE: join(base, 'test', 'fixtures', 'GeoIP2-ISP-Test.mmdb'),
};

/** @type {import('mocha').RootHookObject} */
export const mochaHooks = {
    afterAll() {
        process.env = { ...env };
    },
};
