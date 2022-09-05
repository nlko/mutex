"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const ramda_1 = require("ramda");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const uuid_1 = require("uuid");
const MAXIMUM_TIMEOUT = process.env.MAXIMUM_TIMEOUT
    ? parseInt(process.env.MAXIMUM_TIMEOUT)
    : 20000;
const DEFAULT_TIMEOUT = process.env.DEFAULT_TIMEOUT
    ? parseInt(process.env.DEFAULT_TIMEOUT)
    : 10000;
const adjustState = (state) => {
    return Object.keys(state).reduce((acc, name) => {
        const elems = state[name];
        if (elems.length && !elems[0].running) {
            const newElems = (0, ramda_1.adjust)(0, (item) => {
                item.inform.next(item.uuid);
                item.inform.complete();
                return Object.assign(Object.assign({}, item), { running: true });
            }, elems);
            return Object.assign(Object.assign({}, acc), { [name]: newElems });
        }
        return acc;
    }, {});
};
const appendMutexItem = (name, mutexItem) => (state) => {
    var _a;
    const prevMutexState = (_a = state[name]) !== null && _a !== void 0 ? _a : [];
    return Object.assign(Object.assign({}, state), { [name]: [...prevMutexState, mutexItem] });
};
const removeMutexItem = (name, uuid) => (state) => {
    if (!state[name])
        return state;
    const idx = state[name].findIndex((0, ramda_1.propEq)('uuid', uuid));
    if (idx < 0)
        return state;
    const newList = (0, ramda_1.remove)(idx, 1, state[name]);
    return Object.assign(Object.assign({}, state), { [name]: newList });
};
let AppController = class AppController {
    constructor(loggerService) {
        this.loggerService = loggerService;
        this.state$s = new rxjs_1.Subject();
        this.state$ = this.state$s.pipe((0, operators_1.scan)((state, command) => {
            this.loggerService.verbose(command);
            if (command.tag == 'append') {
                return appendMutexItem(command.name, command.mutexItem)(state);
            }
            else if (command.tag == 'remove') {
                return removeMutexItem(command.name, command.uuid)(state);
            }
            return state;
        }, {}), (0, operators_1.map)(adjustState));
        this.state$.subscribe((mutexes) => { });
    }
    wait(name, options = {}) {
        var _a;
        const inform = new rxjs_1.ReplaySubject(1);
        const uuid = (0, uuid_1.v4)();
        this.state$s.next({
            tag: 'append',
            name,
            mutexItem: { uuid, inform, running: false, date: new Date(Date.now()) },
        });
        const realTimeout = (0, ramda_1.max)(0, (0, ramda_1.min)((_a = options.mutexTimeout) !== null && _a !== void 0 ? _a : DEFAULT_TIMEOUT, MAXIMUM_TIMEOUT));
        this.loggerService.log(`Waiting ${name} / ${uuid} (timeout ${realTimeout})`);
        return inform.pipe((0, rxjs_1.timeout)(realTimeout), (0, operators_1.first)(), (0, operators_1.map)((uuid) => {
            this.loggerService.log(`Aquired ${name} / ${uuid}`);
            if (options.url) {
                return [options.url, uuid].join('/');
            }
            return uuid;
        }), (0, operators_1.catchError)((err) => {
            this.loggerService.log(`Rejecting ${name} / ${uuid}`);
            this.state$s.next({ tag: 'remove', name, uuid });
            throw new common_1.RequestTimeoutException();
        }));
    }
    get_mutex(name, urlFormat, timeout, req) {
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
    signal(name, uuid) {
        this.loggerService.log(`Releasing ${name} / ${uuid}`);
        this.state$s.next({ tag: 'remove', name, uuid });
        return (0, rxjs_1.of)(void 0);
    }
};
__decorate([
    (0, common_1.Get)(':name'),
    __param(0, (0, common_1.Param)('name')),
    __param(1, (0, common_1.Query)('url')),
    __param(2, (0, common_1.Query)('timeout')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], AppController.prototype, "get_mutex", null);
__decorate([
    (0, common_1.Get)(':name/:uuid'),
    __param(0, (0, common_1.Param)('name')),
    __param(1, (0, common_1.Param)('uuid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], AppController.prototype, "signal", null);
AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [common_1.Logger])
], AppController);
exports.AppController = AppController;
//# sourceMappingURL=app.controller.js.map