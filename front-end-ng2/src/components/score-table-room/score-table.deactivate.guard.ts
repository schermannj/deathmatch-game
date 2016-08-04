import {CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from "@angular/router";
import {ScoreTableRoomComponent} from "./score-table-room.component";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {STORAGE_KEYS, STATE_STATUS} from "../../util/config.util";

@Injectable()
export class ScoreTableDeactivateGuard implements CanDeactivate<ScoreTableRoomComponent> {

    constructor(private router: Router) {
    }

    canDeactivate(component: ScoreTableRoomComponent,
                  route: ActivatedRouteSnapshot,
                  state: RouterStateSnapshot): Observable<boolean>|boolean {

        if (Boolean(localStorage.getItem(STORAGE_KEYS.CAN_DEACTIVATE_SCORE_TABLE_ROOM))) {
            return true;
        }

        if (localStorage.getItem(STORAGE_KEYS.STATE) === STATE_STATUS.FINISHED) {
            this.router.navigate(['/']);
            localStorage.setItem(STORAGE_KEYS.CAN_DEACTIVATE_SCORE_TABLE_ROOM, String(true));

            return false;
        }

        return true;
    }

}