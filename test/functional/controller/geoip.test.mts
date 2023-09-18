import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, before, describe, it } from 'mocha';
import { expect } from 'chai';
import express, { type Express } from 'express';
import request from 'supertest';
import type { ErrorResponse } from '@myrotvorets/express-microservice-middlewares';
import { environment } from '../../../src/lib/environment.mjs';
import { configureApp } from '../../../src/server.mjs';

let app: Express;
const env = { ...process.env };

describe('GeoIPController', () => {
    before(() => {
        process.env = {
            NODE_ENV: 'test',
            PORT: '3030',
            GEOIP_CITY_FILE: join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'GeoIP2-City-Test.mmdb'),
            GEOIP_ISP_FILE: join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'GeoIP2-ISP-Test.mmdb'),
        };

        environment();

        app = express();
        app.disable('x-powered-by');
        app.set('trust proxy', true);
        return configureApp(app);
    });

    afterEach(() => (process.env = { ...env }));

    describe('Error handling', () => {
        it('should fail on invalid IP', () => {
            return request(app)
                .get('/geolocate/256.0.0.1')
                .expect(400)
                .expect((res: request.Response) => {
                    const body = res.body as ErrorResponse;
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

    describe('Normal operation', () => {
        describe('countryHandler', () => {
            it('should return the expected results', () => {
                return request(app)
                    .get('/country')
                    .set('X-Forwarded-For', '2.125.160.216')
                    .expect(200)
                    .expect({
                        success: true,
                        response: {
                            cc: 'GB',
                            country: 'United Kingdom',
                        },
                    });
            });
        });

        describe('geolocateHandler', () => {
            it('should return the expected results', () => {
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