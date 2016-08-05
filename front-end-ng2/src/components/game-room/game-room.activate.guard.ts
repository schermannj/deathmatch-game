import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from "@angular/router";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {STORAGE_KEYS, STATE_STATUS, PLAYER_STATE} from "../../util/config.util";
import {Subscriber} from "rxjs";
import {SocketService} from "../../services/socket.service";
import {EVENTS} from '../../util/shared-util.adapter';

@Injectable()
export class GameRoomActivateGuard implements CanActivate {

    constructor(private router: Router, private socket: SocketService) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>|boolean {
        let params: any = route.params;

        localStorage.setItem(STORAGE_KEYS.CAN_DEACTIVATE_GAME_ROOM, String(false));

        let gameState = localStorage.getItem(STORAGE_KEYS.STATE);

        let areStateParamsEqual = localStorage.getItem(STORAGE_KEYS.GAME) === params.game
            && localStorage.getItem(STORAGE_KEYS.PLAYER) === params.player;

        if (gameState === STATE_STATUS.STARTED && areStateParamsEqual) {

            return Observable.create((subscriber: Subscriber<boolean>) => {
                this.socket.connect()
                    .once(EVENTS.FE.PLAYER_RECONNECTED, () => {
                        subscriber.next(true);
                        subscriber.complete();
                    })
                    .emit(EVENTS.BE.RECONNECT, {game: params.game, player: params.player, state: PLAYER_STATE.STARTED});
            });

        } else if (gameState === STATE_STATUS.FINISHED) {
            this.router.navigate(['/scores', params.game]);
        } else {
            this.router.navigate(['/404']);
        }

        return false;
    }

}