import {CanDeactivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot} from "@angular/router";
import {GameRoomComponent} from "./game-room.component";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {STATE_STATUS, STORAGE_KEYS} from "../../util/config.util";
import {SocketService} from "../../services/socket.service";

@Injectable()
export class GameRoomDeactivateGuard implements CanDeactivate<GameRoomComponent> {

    constructor(private router: Router, private socket: SocketService) {
    }

    canDeactivate(component: GameRoomComponent,
                  route: ActivatedRouteSnapshot,
                  state: RouterStateSnapshot): Observable<boolean>|boolean {

        if (Boolean(localStorage.getItem(STORAGE_KEYS.CAN_DEACTIVATE_GAME_ROOM))) {
            return true;
        }

        if (localStorage.getItem(STORAGE_KEYS.STATE) !== STATE_STATUS.FINISHED) {
            this.socket.io().removeAllListeners();
            this.router.navigate(['/']);
            localStorage.setItem(STORAGE_KEYS.CAN_DEACTIVATE_GAME_ROOM, String(true));

            return false;
        }

        return true;
    }

}