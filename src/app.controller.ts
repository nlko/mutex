import { Controller, Get, Param, RequestTimeoutException } from '@nestjs/common';
import { adjust, propEq, remove, min, max } from 'ramda';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { Informer, State } from 'storyx';
import { v4 as uuidv4 } from 'uuid';

const MAXIMUM_TIMEOUT = process.env.MAXIMUM_TIMEOUT || 20000;
const DEFAULT_TIMEOUT = process.env.DEFAULT_TIMEOUT || 10000;

@Controller()
export class AppController {
  
  state = new State<{}>({});

  constructor() {
    this.state.obs$.subscribe((state)=>{
      Object.keys(state).forEach((id)=>{
        if(state[id].length && !state[id][0].running) {

          this.state.update(state=>{

            const newId = adjust(0, item => {
              item.inform.inform(item.uuid);
              return ({...item, running:true})
            }, state[id])

            return {
              ...state,
              [id]: newId
            }
          })
        }
      })
    })
  }

  private append = (id, newVal) => stateContent => {

    return {
      ...stateContent, 
      [id]: stateContent[id]? [...stateContent[id], newVal]:[newVal]
    }
  };

  private remove = (id, uuid) => state => {
    if(!state[id]) return state
  
    const idx = state[id].findIndex(propEq('uuid', uuid));
    if(idx<0) return state

    const newList = remove(idx, 1, state[id]);


    return {
      ...state, 
      [id]: newList
    }
  };

  wait(name: string, timeOut = DEFAULT_TIMEOUT): Observable<string> {
  
    const inform = new Informer<string>();
    const uuid = uuidv4();    

    this.state.updater$s.next(this.append(name, {uuid, inform, running:false, date: null}));

    const realTimeout = max(0, min(timeOut, MAXIMUM_TIMEOUT));
 
    return inform.obs$.pipe(
      timeout(realTimeout),
      catchError(err =>{

        this.state.updater$s.next(this.remove(name, uuid));

        throw new RequestTimeoutException()
      }), 
    );
  }

  @Get(':name')
  get_mutex(@Param('name') name): Observable<string> {
    return this.wait(name)
  }
  
  @Get(':name/:uuid')
  signal(@Param('name') name, @Param('uuid') uuid): Observable<void|string> {

    if(isNaN(uuid)){
      this.state.updater$s.next(this.remove(name, uuid));
      return of();
    }

    return this.wait(name, parseInt(uuid));
  }
}