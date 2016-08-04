import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from "@angular/router";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {STORAGE_KEYS} from "../../util/config.util";

@Injectable()
export class GameRoomActivateGuard implements CanActivate {

    constructor(private router: Router) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>|boolean {
        localStorage.setItem(STORAGE_KEYS.CAN_DEACTIVATE_GAME_ROOM, String(false));

        return true;
    }

}