import {Component} from "@angular/core";
import './app.component.scss';
import {CreateRoomComponent} from "../create-room/create-room.component";
import {SocketService} from "../../services/socket.service";

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html',
    providers: [SocketService],
    directives: [CreateRoomComponent]
})
export class AppComponent {

    constructor() {
    }
}