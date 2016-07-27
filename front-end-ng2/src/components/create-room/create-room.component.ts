import {Component} from "@angular/core";
import "./create-room.component.scss";
import {MD_INPUT_DIRECTIVES} from "@angular2-material/input";
import {MD_TOOLBAR_DIRECTIVES} from "@angular2-material/toolbar";
import {MD_CARD_DIRECTIVES} from "@angular2-material/card";
import {SocketService} from "../../services/socket.service";
import {ROUTER_DIRECTIVES} from "@angular/router";

@Component({
    selector: 'create-room',
    templateUrl: './create-room.component.html',
    directives: [ROUTER_DIRECTIVES, MD_CARD_DIRECTIVES, MD_TOOLBAR_DIRECTIVES, MD_INPUT_DIRECTIVES]
})
export class CreateRoomComponent {
    public nickname: String;

    constructor(private socket: SocketService) {
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
        if(!this.socket.hasConnection()) {
            this.subscribe();
        }

        this.socket.io().emit('createRoom', {username: this.nickname});
    }

    private subscribe() {
        this.socket.connect()
            .on('serverError', function (resp: any) {
                alert(resp.message);
            })
            .once('roomCreated', function (resp: any) {
                // $state.go('wait-for-player', resp)
                console.log('roomCreated, going to wait-room!')
            });
    }

}