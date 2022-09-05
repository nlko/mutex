import { Logger } from '@nestjs/common';
import { Request } from 'express';
import { Observable, ReplaySubject, Subject } from 'rxjs';
interface MutexItem {
    uuid: string;
    inform: ReplaySubject<string>;
    running: boolean;
    date: Date;
}
type Mutexes = Record<string, MutexItem[]>;
type Commands = {
    tag: 'append';
    name: string;
    mutexItem: MutexItem;
} | {
    tag: 'remove';
    name: string;
    uuid: string;
};
export declare class AppController {
    private loggerService;
    state$s: Subject<Commands>;
    state$: Observable<Mutexes>;
    constructor(loggerService: Logger);
    wait(name: string, options?: {
        mutexTimeout?: number;
        url?: string;
    }): Observable<string>;
    get_mutex(name: any, urlFormat: any, timeout: any, req: Request): Observable<string>;
    signal(name: any, uuid: any): Observable<void | string>;
}
export {};
