import {
    HealthChecker,
    HealthEndpoint,
    LivenessEndpoint,
    ReadinessEndpoint,
    ShutdownCheck,
} from '@cloudnative/health-connect';
import { Router } from 'express';
import { addJsonContentTypeMiddleware } from '@myrotvorets/express-microservice-middlewares';

export let healthChecker: HealthChecker | undefined;

export function monitoringController(): Router {
    const router = Router();

    const shutdownCheck = new ShutdownCheck('SIGTERM', (): Promise<void> => Promise.resolve());

    healthChecker = new HealthChecker();
    healthChecker.registerShutdownCheck(shutdownCheck);

    router.use(addJsonContentTypeMiddleware);
    router.get('/live', LivenessEndpoint(healthChecker));
    router.get('/ready', ReadinessEndpoint(healthChecker));
    router.get('/health', HealthEndpoint(healthChecker));

    return router;
}
