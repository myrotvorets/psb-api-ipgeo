import { hrTime, hrTimeDuration, hrTimeToMicroseconds } from '@opentelemetry/core';

export function observe<TArgs extends unknown[]>(what: (...args: TArgs) => void, ...args: TArgs): number {
    const start = hrTime();
    what(...args);
    const end = hrTime();
    const duration = hrTimeDuration(start, end);
    return hrTimeToMicroseconds(duration);
}
