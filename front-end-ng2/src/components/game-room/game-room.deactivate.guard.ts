import {CanDeactivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot} from "@angular/router";
import {GameRoomComponent} from "./game-room.component";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {STATE_STATUS, STORAGE_KEYS} from "../../util/config.util";

@Injectable()
export class GameRoomDeactivateGuard implements CanDeactivate<GameRoomComponent> {

    constructor(private router: Router) {
    }

    canDeactivate(component: GameRoomComponent,
                  route: ActivatedRouteSnapshot,
                  state: RouterStateSnapshot): Observable<boolean>|boolean {

        if (localStorage.getItem(STORAGE_KEYS.STATE) !== STATE_STATUS.FINISHED) {
            this.router.navigate(['/']);

            return false;
        }

        return false;
    }

}