import { expect } from 'chai';
import { container, initializeContainer } from '../../../src/lib/container.mjs';
import { MeteredGeoIPService } from '../../../src/services/meteredgeoipservice.mjs';

describe('Container', function () {
    beforeEach(function () {
        return container.dispose();
    });

    describe('initializeContainer', function () {
        it('should initialize the container', function () {
            const container = initializeContainer();

            expect(container.resolve('geoIPService')).to.be.an('object').that.is.instanceOf(MeteredGeoIPService);

            expect(container.resolve('environment'))
                .to.be.an('object')
                .that.has.property('NODE_ENV')
                .that.is.a('string');

            expect(container.resolve('tracer'))
                .to.be.an('object')
                .that.has.property('startActiveSpan')
                .that.is.a('function');
        });
    });
});
