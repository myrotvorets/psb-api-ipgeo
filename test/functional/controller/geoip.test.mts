import type { RequestListener } from 'node:http';
import { expect } from 'chai';
import request from 'supertest';
import type { ApiErrorResponse } from '@myrotvorets/express-microservice-middlewares';
import { configureApp, createApp } from '../../../src/server.mjs';
import { container } from '../../../src/lib/container.mjs';

describe('GeoIPController', function () {
    let app: RequestListener;

    before(async function () {
        await container.dispose();
        const application = createApp();
        configureApp(application);
        app = application as RequestListener;
    });

    describe('Error handling', function () {
        it('should fail on invalid IP', function () {
            return request(app)
                .get('/geolocate/256.0.0.1')
                .expect(400)
                .expect((res: request.Response) => {
                    const body = res.body as ApiErrorResponse;
                    expect(body)
                        .to.be.an('object')
                        .and.include({
                            success: false,
                            status: 400,
                            code: 'BAD_REQUEST',
                        })
                        .and.have.property('message')
                        .that.is.a('string')
                        .that.contains('request/params/ip');
                });
        });
    });

    describe('Normal operation', function () {
        describe('geolocateHandler', function () {
            it('should return the expected results', function () {
                return request(app)
                    .get('/geolocate/1.128.0.0')
                    .expect(200)
                    .expect({
                        success: true,
                        response: {
                            cprefix: 8,
                            iprefix: 11,
                            cc: null,
                            country: null,
                            city: null,
                            id: null,
                            asn: 1221,
                            asnOrg: 'Telstra Pty Ltd',
                            isp: 'Telstra Internet',
                            org: 'Telstra Internet',
                        },
                    });
            });
        });
    });
});
