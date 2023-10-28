import { Mock, mock } from 'node:test';
import type { MMDBReaderServiceInterface, Response } from '../../../src/services/mmdbreaderserviceinterface.mjs';

export class FakeMMDBReader<T extends Response> implements MMDBReaderServiceInterface<T> {
    public load(_db: Buffer): void {
        // Do nothing.
    }

    public getWithPrefixLength: Mock<MMDBReaderServiceInterface<T>['getWithPrefixLength']> = mock.fn<
        MMDBReaderServiceInterface<T>['getWithPrefixLength']
    >(() => [null, 0]);
}
