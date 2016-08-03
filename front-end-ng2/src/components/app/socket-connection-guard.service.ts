import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from "@angular/router";
import {Observable} from "rxjs";
import {Injectable} from "@angular/core";
import {SocketService} from "../../services/socket.service";

@Injectable()
export class SocketConnectionGuard implements CanActivate {

    constructor(private router: Router, private socket: SocketService) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>|boolean {

        if (this.socket.hasConnection()) {
            return true;
        } else {
            this.router.navigate(['404']);

            return false;
        }
    }

}