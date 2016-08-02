import {Component} from "@angular/core";
import "./join-room.component.scss";
import {MD_CARD_DIRECTIVES} from "@angular2-material/card";
import {SocketService} from "../../services/socket.service";
import {ROUTER_DIRECTIVES, Router, ActivatedRoute} from "@angular/router";
import {IGameResponse, IPlayerRoomResponse} from "../../util/app.Interfaces";
import {MD_BUTTON_DIRECTIVES} from "@angular2-material/button";
import {MD_INPUT_DIRECTIVES} from "@angular2-material/input";
import {BaseConnectToRoomComponent} from "../base.connect-to-room.component";

@Component({
    selector: 'join-room',
    templateUrl: './join-room.component.html',
    directives: [ROUTER_DIRECTIVES, MD_CARD_DIRECTIVES, MD_BUTTON_DIRECTIVES, MD_INPUT_DIRECTIVES]
})
export class JoinRoomComponent extends BaseConnectToRoomComponent {
    public game: String;

    constructor(private route: ActivatedRoute,
                router: Router,
                socket: SocketService) {

        super(router, socket);
    }

    public ngOnInit() {
        this.route.params.subscribe((params: IGameResponse) => {
            this.game = params.game;
        });
    }

    protected doOnEnterPressed() {
        this.socket.io().emit('joinRoom', {game: this.game, username: this.nickname});
    }

    protected subscribe() {
        let self: any = this;

        self.socket.io()
            .once('playerJoined', (resp: IPlayerRoomResponse) => {
                self.router.navigate(['/room', resp.game, resp.player]);
            });
    }
}
