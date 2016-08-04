import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from "@angular/router";
import {Injectable} from "@angular/core";
import {Observable, Subscriber} from "rxjs";
import {STORAGE_KEYS, STATE_STATUS} from "../../util/config.util";
import {SocketService} from "../../services/socket.service";

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
                    .once('playerReconnected', () => {
                        subscriber.next(true);
                        subscriber.complete();
                    })
                    .emit('reconnectPlayer', {game: params.game, player: params.player});
            });
        } else if (!areStateParamsEqual && this.socket.hasConnection()) {

            return true;
        } else {
            this.router.navigate(['/']);

            return false;
        }
    }
}