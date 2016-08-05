import {Component, ViewChild, OnInit} from "@angular/core";
import "./game-room.component.scss";
import {MD_TOOLBAR_DIRECTIVES} from "@angular2-material/toolbar";
import {MD_CARD_DIRECTIVES} from "@angular2-material/card";
import {SocketService} from "../../services/socket.service";
import {ROUTER_DIRECTIVES, Router, ActivatedRoute} from "@angular/router";
import {
    IPlayerRoomResponse,
    IPlayer,
    IReceiveQuestionResponse,
    IScoreCountdownResponse,
    IQuestion,
    IAnswerAcceptedResponse,
    IGameOverResponse
} from "../../util/app.Interfaces";
import {MD_BUTTON_DIRECTIVES} from "@angular2-material/button";
import RestService from "../../services/rest.service";
import {MD_PROGRESS_BAR_DIRECTIVES} from "@angular2-material/progress-bar";
import {MD_RADIO_DIRECTIVES} from "@angular2-material/radio";
import {MdUniqueSelectionDispatcher} from "@angular2-material/core";
import {AcceptAnswerModalComponent} from "./accept-answer/accept-answer.modal.component";
import {GameOverModalComponent} from "./game-over/game-over.modal.component";
import {STORAGE_KEYS, STATE_STATUS} from "../../util/config.util";
import {EVENTS, PLAYER_CONST} from '../../util/shared-util.adapter';

@Component({
    selector: 'game-room',
    templateUrl: './game-room.component.html',
    directives: [
        ROUTER_DIRECTIVES,
        MD_CARD_DIRECTIVES,
        MD_TOOLBAR_DIRECTIVES,
        MD_BUTTON_DIRECTIVES,
        MD_PROGRESS_BAR_DIRECTIVES,
        MD_RADIO_DIRECTIVES,
        AcceptAnswerModalComponent,
        GameOverModalComponent
    ],
    providers: [MdUniqueSelectionDispatcher]
})
export class GameRoomComponent implements OnInit {
    public game: String;
    public player: IPlayer;
    public question: IQuestion;
    public answer: any;
    public checkingAnswer: boolean = false;
    public playerGameScore: number = 0;
    public currentQuestionScore: number;

    @ViewChild('acceptAnswerModal')
    private acceptAnswerModal: AcceptAnswerModalComponent;

    @ViewChild('gameOverModal')
    private gameOverModal: GameOverModalComponent;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private socket: SocketService,
                private rest: RestService) {
    }

    public answerQuestion() {
        // TODO: add checkbox support
        this.doAnswer([this.answer]);
    }

    public skipQuestion() {
        this.doAnswer([]);
    }

    public getQuestionScoreProgress(): Number {
        let progressValue = (this.currentQuestionScore * 100) / PLAYER_CONST.PLAYER_START_SCORE;

        return isNaN(progressValue) ? 0 : progressValue;
    }

    public getQuestion() {
        this.socket
            .io()
            .emit(EVENTS.BE.GET_QUESTION, {
                game: this.game,
                player: this.player
            });
    }

    public onAcceptAnswerModalClose() {
        this.checkingAnswer = false;
        this.answer = null;
        this.getQuestion();
    }

    public onGameOverModalClose() {
        this.router.navigate(['scores', this.game]);
    }

    ngOnInit() {
        let self = this;

        self.route.params.subscribe((params: IPlayerRoomResponse) => {
            self.game = params.game;

            self.rest.getPlayer(params.player).subscribe((player: IPlayer) => {
                self.player = player;

                self.subscribe();
                self.getQuestion();
            })
        });
    }

    private doAnswer(answer: Array<any>) {
        this.checkingAnswer = true;

        this.socket.io().emit(EVENTS.BE.ANSWER, {
            game: this.game,
            player: this.player,
            question: {
                _id: this.question.id,
                answer: answer,
            }
        });
    }

    private subscribe() {
        let self: any = this;

        self.socket
            .io()
            .on(EVENTS.FE.ANSWER_ACCEPTED, (resp: IAnswerAcceptedResponse) => {
                self.acceptAnswerModal.open(resp);
            })
            .once(EVENTS.FE.GAME_OVER, (resp: IGameOverResponse) => {
                localStorage.setItem(STORAGE_KEYS.STATE, STATE_STATUS.FINISHED);
                self.gameOverModal.open(resp);
            })
            .on(EVENTS.FE.RECEIVE_QUESTION, (resp: IReceiveQuestionResponse) => {
                self.question = resp.question;
                self.currentQuestionScore = resp.qScore;
                self.playerGameScore = resp.totalScore;
            })
            .on(EVENTS.FE.SCORE_COUNTDOWN, (resp: IScoreCountdownResponse) => {
                self.currentQuestionScore = resp.score;
            });
    }
}
