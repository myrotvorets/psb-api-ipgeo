import { Reader } from 'mmdb-lib';
import { MMDBReaderServiceInterface, Response } from './mmdbreaderserviceinterface.mjs';

export class MMDBReaderService<T extends Response> implements MMDBReaderServiceInterface<T> {
    #reader: Reader<T> | null = null;

    public load(db: Buffer): void {
        this.#reader = new Reader(db);
    }

    public getWithPrefixLength(ip: string): [T | null, number] {
        return this.#reader?.getWithPrefixLength(ip) ?? [null, 0];
    }
}
