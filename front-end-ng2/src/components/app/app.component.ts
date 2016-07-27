import {Component} from "@angular/core";
import './app.component.scss';
import {CreateRoomComponent} from "../create-room/create-room.component";
import {SocketService} from "../../services/socket.service";
import {ROUTER_DIRECTIVES} from "@angular/router";

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html',
    providers: [SocketService],
    precompile: [CreateRoomComponent],
    directives: [ROUTER_DIRECTIVES, CreateRoomComponent]
})
export class AppComponent {

    constructor() {
    }
}