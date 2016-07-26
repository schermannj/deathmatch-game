import {Component} from "@angular/core";
import './app.component.scss';
import {CreateRoomComponent} from "../create-room/create-room.component";
// import {ROUTER_DIRECTIVES} from "@angular/router";

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html',
    providers: [],
    // directives: [ROUTER_DIRECTIVES]
    directives: [CreateRoomComponent]
})
export class AppComponent {

    constructor() {
    }
}