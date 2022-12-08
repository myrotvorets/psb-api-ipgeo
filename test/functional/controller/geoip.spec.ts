import { join } from 'path';
import express from 'express';
import request from 'supertest';
import { ErrorResponse } from '@myrotvorets/express-microservice-middlewares';
import { environment } from '../../../src/lib/environment';
import { configureApp } from '../../../src/server';

let app: express.Express;
const env = { ...process.env };

async function buildApp(): Promise<express.Express> {
    process.env = {
        NODE_ENV: 'test',
        PORT: '3030',
        GEOIP_CITY_FILE: join(__dirname, '..', 'fixtures', 'GeoIP2-City-Test.mmdb'),
        GEOIP_ISP_FILE: join(__dirname, '..', 'fixtures', 'GeoIP2-ISP-Test.mmdb'),
    };

    environment();

    const application = express();
    application.disable('x-powered-by');
    application.set('trust proxy', true);
    await configureApp(application);
    return application;
}

beforeEach(() => {
    jest.resetAllMocks();

    return buildApp().then((application) => {
        app = application;
    });
});

afterEach(() => (process.env = { ...env }));

describe('GeoIPController', () => {
    describe('Error handling', () => {
        it('should fail on invalid IP', () => {
            return request(app)
                .get('/geolocate/256.0.0.1')
                .expect(400)
                .expect((res: request.Response) => {
                    expect(res.body).toEqual(expect.any(Object));
                    expect(res.body).toHaveProperty('success');
                    expect(res.body).toHaveProperty('status');
                    expect(res.body).toHaveProperty('code');
                    expect(res.body).toHaveProperty('message');

                    const body = res.body as ErrorResponse;
                    expect(body.success).toBe(false);
                    expect(body.status).toBe(400);
                    expect(body.code).toBe('BAD_REQUEST');
                    expect(body.message).toContain('request/params/ip');
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
