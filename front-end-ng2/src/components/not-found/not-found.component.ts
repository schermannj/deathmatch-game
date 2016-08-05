import {Component} from "@angular/core";
import "./not-found.component.scss";
import {MD_CARD_DIRECTIVES} from "@angular2-material/card";
import {ROUTER_DIRECTIVES} from "@angular/router";

@Component({
    selector: 'not-found',
    templateUrl: './not-found.component.html',
    directives: [
        ROUTER_DIRECTIVES,
        MD_CARD_DIRECTIVES,
    ]
})
export class NotFoundComponent {
}
