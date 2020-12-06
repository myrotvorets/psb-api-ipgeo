import express from 'express';
import request from 'supertest';
import monitoringController, { healthChecker } from '../../../src/controllers/monitoring';

let app: express.Express;

function buildApp(): express.Express {
    const application = express();
    application.disable('x-powered-by');
    application.use('/monitoring', monitoringController());
    return application;
}

afterEach(() => process.removeAllListeners('SIGTERM'));

beforeEach(() => {
    app = buildApp();
    healthChecker.shutdownRequested = false;
});

describe('MonitoringController', () => {
    const checker200 = (endpoint: string): Promise<unknown> =>
        request(app).get(`/monitoring/${endpoint}`).expect('Content-Type', /json/u).expect(200);

    const checker503 = (endpoint: string): Promise<unknown> => {
        healthChecker.shutdownRequested = true;
        return request(app).get(`/monitoring/${endpoint}`).expect('Content-Type', /json/u).expect(503);
    };

    describe('Liveness Check', () => {
        it('should succeed', () => checker200('live'));
        it('should fail when shutdown requested', () => checker503('live'));
    });

    describe('Readyness Check', () => {
        it('should succeed', () => checker200('ready'));
        it('should fail when shutdown requested', () => checker503('ready'));
    });

    describe('Health Check', () => {
        it('should succeed', () => checker200('health'));
        it('should fail when shutdown requested', () => checker503('health'));
    });
});
