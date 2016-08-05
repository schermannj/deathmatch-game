import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from "@angular/router";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Subscriber} from "rxjs/Subscriber";
import {STORAGE_KEYS, STATE_STATUS, PLAYER_STATE} from "../../util/config.util";
import {SocketService} from "../../services/socket.service";
import {EVENTS} from '../../util/shared-util.adapter';

@Injectable()
export class WaitingRoomActivateGuard implements CanActivate {

    constructor(private router: Router, private socket: SocketService) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>|boolean {
        let params: any = route.params;

        let areStateParamsEqual = localStorage.getItem(STORAGE_KEYS.GAME) === params.game
            && localStorage.getItem(STORAGE_KEYS.PLAYER) === params.player;

        let cameFromWaitingRoom = localStorage.getItem(STORAGE_KEYS.STATE) === STATE_STATUS.WAITING;

        if (areStateParamsEqual && cameFromWaitingRoom) {
            return Observable.create((subscriber: Subscriber<boolean>) => {
                this.socket.connect()
                    .once(EVENTS.FE.PLAYER_RECONNECTED, () => {
                        subscriber.next(true);
                        subscriber.complete();
                    })
                    .emit(EVENTS.BE.RECONNECT, {game: params.game, player: params.player, state: PLAYER_STATE.CONNECTED});
            });
        } else if (!areStateParamsEqual && this.socket.hasConnection()) {

            return true;
        } else {
            this.router.navigate(['/']);

            return false;
        }
    }
}