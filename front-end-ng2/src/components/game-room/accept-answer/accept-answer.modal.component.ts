import {Component, ViewChild, Output, EventEmitter} from "@angular/core";
import {MD_CARD_DIRECTIVES} from "@angular2-material/card";
import {MD_BUTTON_DIRECTIVES} from "@angular2-material/button";
import {MODAL_DIRECTIVES, ModalComponent} from "ng2-bs3-modal/ng2-bs3-modal";
import 'bootstrap';
import {IAnswerAcceptedResponse} from "../../../util/app.Interfaces";

@Component({
    selector: 'accept-answer-modal',
    template: `
        <modal #modal [keyboard]="false" [backdrop]="'static'">
            <md-card>
                <md-card-title>{{isCorrect ? 'Wowser, keep moving this way!' : 'Oooops...'}}</md-card-title>
                <md-card-content>
                    <h4>Score: {{score}}</h4>
                </md-card-content>
                <md-card-actions>
                    <button md-raised-button (click)="close()">NEXT</button>
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
export class AcceptAnswerModalComponent {

    private isCorrect: boolean;
    private score: number;

    @ViewChild('modal')
    private modal: ModalComponent;

    @Output()
    public onClose: EventEmitter<void> = new EventEmitter<void>();

    public open(resp: IAnswerAcceptedResponse) {
        this.isCorrect = resp.isCorrect;
        this.score = resp.totalScore;

        this.modal.open();
    }

    public close() {
        this.modal.close();
        this.onClose.emit(undefined);
    }
}
