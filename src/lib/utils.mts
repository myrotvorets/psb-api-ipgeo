import { hrtime } from 'node:process';

export function observe<TArgs extends unknown[]>(what: (...args: TArgs) => void, ...args: TArgs): number {
    const start = hrtime.bigint();
    what(...args);
    const end = hrtime.bigint();

    return Number((end - start) / 1000n);
}
