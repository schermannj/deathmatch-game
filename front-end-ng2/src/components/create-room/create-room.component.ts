import {Component} from "@angular/core";
import "./create-room.component.scss";
import {MD_INPUT_DIRECTIVES} from "@angular2-material/input";
import {MD_CARD_DIRECTIVES} from "@angular2-material/card";
import {SocketService} from "../../services/socket.service";
import {ROUTER_DIRECTIVES, Router} from "@angular/router";
import {IPlayerRoomResponse} from "../../util/app.Interfaces";
import {BaseConnectToRoomComponent} from "../base.connect-to-room.component";
import {EVENTS} from '../../util/shared-util.adapter';

@Component({
    selector: 'create-room',
    templateUrl: './create-room.component.html',
    directives: [ROUTER_DIRECTIVES, MD_CARD_DIRECTIVES, MD_INPUT_DIRECTIVES]
})
export class CreateRoomComponent extends BaseConnectToRoomComponent {

    constructor(router: Router, socket: SocketService) {
        super(router, socket);
    }

    protected doOnEnterPressed() {
        this.socket.io().emit(EVENTS.BE.CREATE_ROOM, {username: this.nickname});
    }

    protected subscribe() {
        let self: any = this;

        self.socket.io()
            .once(EVENTS.FE.ROOM_CREATED, (resp: IPlayerRoomResponse) => {
                self.router.navigate(['/room', resp.game, resp.player]);
            });
    }
}
