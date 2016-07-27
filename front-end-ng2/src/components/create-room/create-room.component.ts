import {Component} from "@angular/core";
import "./create-room.component.scss";
import {MD_INPUT_DIRECTIVES} from "@angular2-material/input";
import {MD_TOOLBAR_DIRECTIVES} from "@angular2-material/toolbar";
import {MD_CARD_DIRECTIVES} from "@angular2-material/card";
import {SocketService} from "../../services/socket.service";
import {ROUTER_DIRECTIVES, Router} from "@angular/router";
import {IRoomCreatedResponse} from "../../util/app.Interfaces";

@Component({
    selector: 'create-room',
    templateUrl: './create-room.component.html',
    directives: [ROUTER_DIRECTIVES, MD_CARD_DIRECTIVES, MD_TOOLBAR_DIRECTIVES, MD_INPUT_DIRECTIVES]
})
export class CreateRoomComponent {
    public nickname: String;

    constructor(private router: Router, private socket: SocketService) {
    }

    public onEnterPressed(event: KeyboardEvent) {
        if (event.keyCode !== 13) {
            return;
        }

        if (this.nickname.length > 0) {
            this.doSocketActions();
        }
    }

    private doSocketActions() {
        if (!this.socket.hasConnection()) {
            this.subscribe();
        }

        this.socket.io().emit('createRoom', {username: this.nickname});
    }

    private subscribe() {
        let self: any = this;

        self.socket.connect()
            .on('serverError', (resp: any) => {
                alert(resp.message);
            })
            .once('roomCreated', (resp: IRoomCreatedResponse) => {
                self.router.navigate(['/room', resp.game, resp.player]);
            });
    }
}
