import {
  Controller,
  Get,
  Logger,
  Param,
  Query,
  Req,
  RequestTimeoutException,
} from '@nestjs/common';
import { Request } from 'express';
import { adjust, max, min, propEq, remove } from 'ramda';
import { Observable, ReplaySubject, Subject, of, timeout } from 'rxjs';
import { catchError, first, map, scan } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

const MAXIMUM_TIMEOUT = process.env.MAXIMUM_TIMEOUT
  ? parseInt(process.env.MAXIMUM_TIMEOUT)
  : 20000;
const DEFAULT_TIMEOUT = process.env.DEFAULT_TIMEOUT
  ? parseInt(process.env.DEFAULT_TIMEOUT)
  : 10000;

interface MutexItem {
  uuid: string;
  inform: ReplaySubject<string>;
  running: boolean;
  date: Date;
}
type Mutexes = Record<string, MutexItem[]>;

type Commands =
  | { tag: 'append'; name: string; mutexItem: MutexItem }
  | { tag: 'remove'; name: string; uuid: string };

const adjustState = (state: Mutexes): Mutexes => {
  return Object.keys(state).reduce((acc, name) => {
    const elems = state[name];

    if (elems.length && !elems[0].running) {
      const newElems = adjust(
        0,
        (item: MutexItem): MutexItem => {
          item.inform.next(item.uuid);
          item.inform.complete();
          return { ...item, running: true };
        },
        elems,
      );

      return { ...acc, [name]: newElems };
    }
    return acc;
  }, {});
};

const appendMutexItem =
  (name: string, mutexItem: MutexItem) =>
  (state: Mutexes): Mutexes => {
    const prevMutexState = state[name] ?? [];

    return {
      ...state,
      [name]: [...prevMutexState, mutexItem],
    };
  };

const removeMutexItem =
  (name: string, uuid: string) =>
  (state: Mutexes): Mutexes => {
    if (!state[name]) return state;

    const idx = state[name].findIndex(propEq('uuid', uuid));
    if (idx < 0) return state;

    const newList = remove(idx, 1, state[name]);

    return {
      ...state,
      [name]: newList,
    };
  };

@Controller()
export class AppController {
  state$s = new Subject<Commands>();
  state$: Observable<Mutexes> = this.state$s.pipe(
    scan((state, command): Mutexes => {
      this.loggerService.verbose(command);
      if (command.tag == 'append') {
        return appendMutexItem(command.name, command.mutexItem)(state);
      } else if (command.tag == 'remove') {
        return removeMutexItem(command.name, command.uuid)(state);
      }
      return state;
    }, {}),
    map(adjustState),
  );

  constructor(private loggerService: Logger) {
    // The state machine must run
    this.state$.subscribe((mutexes) => {});
  }

  wait(
    name: string,
    options: {
      mutexTimeout?: number;
      url?: string;
    } = {},
  ): Observable<string> {
    const inform = new ReplaySubject<string>(1);
    const uuid = uuidv4();


    this.state$s.next({
      tag: 'append',
      name,
      mutexItem: { uuid, inform, running: false, date: new Date(Date.now()) },
    });

    const realTimeout = max(
      0,
      min(options.mutexTimeout ?? DEFAULT_TIMEOUT, MAXIMUM_TIMEOUT),
    );

    this.loggerService.log(
      `Waiting ${name} / ${uuid} (timeout ${realTimeout})`,
    );

    return inform.pipe(
      timeout(realTimeout),
      first(),
      map((uuid) => {
        this.loggerService.log(`Aquired ${name} / ${uuid}`);
        if (options.url) {
          return [options.url, uuid].join('/');
        }
        return uuid;
      }),
      catchError((err) => {
        this.loggerService.log(`Rejecting ${name} / ${uuid}`);
        this.state$s.next({ tag: 'remove', name, uuid });

        throw new RequestTimeoutException();
      }) as any,
    ) as any;
  }

  @Get(':name')
  get_mutex(
    @Param('name') name,
    @Query('url') urlFormat,
    @Query('timeout') timeout,
    @Req() req: Request,
  ): Observable<string> {

    const mutexTimeout = parseInt(timeout);

    this.loggerService.verbose(`mutexTimeout: ${mutexTimeout}`);

    const url = urlFormat
      ? `${req.protocol}://${req.headers.host}/${name}`
      : undefined;

    this.loggerService.verbose(`url: ${url}`);

    return this.wait(name, {
      mutexTimeout: isNaN(mutexTimeout) ? DEFAULT_TIMEOUT : mutexTimeout,
      url,
    });
  }

  @Get(':name/:uuid')
  signal(@Param('name') name, @Param('uuid') uuid): Observable<void | string> {
    this.loggerService.log(`Releasing ${name} / ${uuid}`);
    this.state$s.next({ tag: 'remove', name, uuid });

    return of(void 0);
  }
}
