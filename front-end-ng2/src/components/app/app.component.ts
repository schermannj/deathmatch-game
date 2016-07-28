import {Component} from "@angular/core";
import "./app.component.scss";
import {CreateRoomComponent} from "../create-room/create-room.component";
import {SocketService} from "../../services/socket.service";
import {ROUTER_DIRECTIVES} from "@angular/router";
import RestService from "../../services/rest.service";
import {HTTP_PROVIDERS} from "@angular/http";
import {WaitingRoomComponent} from "../waiting-room/waiting-room.component";
import {JoinRoomComponent} from "../join-room/join-room.component";

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html',
    providers: [SocketService, RestService, HTTP_PROVIDERS],
    precompile: [CreateRoomComponent, WaitingRoomComponent, JoinRoomComponent],
    directives: [ROUTER_DIRECTIVES, CreateRoomComponent]
})
export class AppComponent {

    constructor() {
    }
}