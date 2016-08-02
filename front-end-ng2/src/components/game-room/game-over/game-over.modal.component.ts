import {Component, ViewChild, Output, EventEmitter} from "@angular/core";
import {MD_CARD_DIRECTIVES} from "@angular2-material/card";
import {MD_BUTTON_DIRECTIVES} from "@angular2-material/button";
import {MODAL_DIRECTIVES, ModalComponent} from "ng2-bs3-modal/ng2-bs3-modal";
import 'bootstrap';
import {IGameOverResponse} from "../../../util/app.Interfaces";

@Component({
    selector: 'game-over-modal',
    template: `
        <modal #modal [keyboard]="false" [backdrop]="'static'">
            <md-card>
                <md-card-title>GAME OVER</md-card-title>
                <md-card-content>
                    <h4>Final score: {{score}}</h4>
                </md-card-content>
                <md-card-actions>
                    <button md-raised-button (click)="close()">LOOK AT SCORE TABLE</button>
                </md-card-actions>
            </md-card>
        </modal>
        `,
    directives: [
        MODAL_DIRECTIVES,
        MD_CARD_DIRECTIVES,
        MD_BUTTON_DIRECTIVES
    ]
})
export class GameOverModalComponent {

    private score: number;

    @ViewChild('modal')
    private modal: ModalComponent;

    @Output()
    public onClose: EventEmitter<void> = new EventEmitter<void>();

    public open(resp: IGameOverResponse) {
        this.score = resp.score;

        this.modal.open();
    }

    public close() {
        this.modal.close();
        this.onClose.emit(undefined);
    }
}
