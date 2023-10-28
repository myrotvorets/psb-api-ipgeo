import type { Response } from 'mmdb-lib';

export type { Response, CityResponse, IspResponse } from 'mmdb-lib';

export interface MMDBReaderServiceInterface<T extends Response = Response> {
    load(db: Buffer): void;
    getWithPrefixLength(ipAddress: string): [T | null, number];
}
