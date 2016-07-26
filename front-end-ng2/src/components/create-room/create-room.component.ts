import {Component} from "@angular/core";
import './create-room.component.scss';
import {MD_INPUT_DIRECTIVES} from "@angular2-material/input";
import {MD_TOOLBAR_DIRECTIVES} from "@angular2-material/toolbar";
import {MD_CARD_DIRECTIVES} from "@angular2-material/card";
// import {ROUTER_DIRECTIVES} from "@angular/router";

@Component({
    selector: 'create-room',
    templateUrl: './create-room.component.html',
    providers: [],
    // directives: [ROUTER_DIRECTIVES]
    directives: [MD_INPUT_DIRECTIVES, MD_TOOLBAR_DIRECTIVES, MD_CARD_DIRECTIVES]
})
export class CreateRoomComponent {
    public nickname:String;

    constructor() {
    }

    onEnterPressed(event: KeyboardEvent) {
        if(event.keyCode === 13) {
            console.log(this.nickname);
        }
    }

}