import type { RequestListener } from 'node:http';
import { expect } from 'chai';
import type { Express } from 'express';
import request from 'supertest';
import { healthChecker, monitoringController } from '../../../src/controllers/monitoring.mjs';
import { createApp } from '../../../src/server.mjs';

describe('MonitoringController', function () {
    let app: Express;

    before(function () {
        app = createApp();
        app.disable('x-powered-by');
        app.use('/monitoring', monitoringController());
    });

    beforeEach(function () {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(healthChecker).not.to.be.undefined;
        healthChecker!.shutdownRequested = false;
    });

    afterEach(function () {
        process.removeAllListeners('SIGTERM');
    });

    const checker200 = (endpoint: string): Promise<unknown> =>
        request(app as RequestListener)
            .get(`/monitoring/${endpoint}`)
            .expect('Content-Type', /json/u)
            .expect(200);

    const checker503 = (endpoint: string): Promise<unknown> => {
        healthChecker!.shutdownRequested = true;
        return request(app as RequestListener)
            .get(`/monitoring/${endpoint}`)
            .expect('Content-Type', /json/u)
            .expect(503);
    };

    describe('Liveness Check', function () {
        it('should succeed', function () {
            return checker200('live');
        });

        it('should fail when shutdown requested', function () {
            return checker503('live');
        });
    });

    describe('Readiness Check', function () {
        it('should succeed', function () {
            return checker200('ready');
        });

        it('should fail when shutdown requested', function () {
            return checker503('ready');
        });
    });

    describe('Health Check', function () {
        it('should succeed', function () {
            return checker200('health');
        });

        it('should fail when shutdown requested', function () {
            return checker503('health');
        });
    });
});
