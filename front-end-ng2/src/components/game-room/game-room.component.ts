import {Component} from "@angular/core";
import "./game-room.component.scss";
import {MD_TOOLBAR_DIRECTIVES} from "@angular2-material/toolbar";
import {MD_CARD_DIRECTIVES} from "@angular2-material/card";
import {SocketService} from "../../services/socket.service";
import {ROUTER_DIRECTIVES, Router, ActivatedRoute} from "@angular/router";
import {
    IPlayerRoomResponse,
    IPlayer,
    IReceiveQuestionResponse,
    IScoreCountdownResponse
} from "../../util/app.Interfaces";
import {MD_BUTTON_DIRECTIVES} from "@angular2-material/button";
import RestService from "../../services/rest.service";
import {MD_PROGRESS_BAR_DIRECTIVES} from "@angular2-material/progress-bar";
import {MD_RADIO_DIRECTIVES} from "@angular2-material/radio";
import {MdUniqueSelectionDispatcher} from "@angular2-material/core";

@Component({
    selector: 'game-room',
    templateUrl: './game-room.component.html',
    directives: [
        ROUTER_DIRECTIVES,
        MD_CARD_DIRECTIVES,
        MD_TOOLBAR_DIRECTIVES,
        MD_BUTTON_DIRECTIVES,
        MD_PROGRESS_BAR_DIRECTIVES,
        MD_RADIO_DIRECTIVES
    ],
    providers: [MdUniqueSelectionDispatcher]
})
export class GameRoomComponent {
    public game: String;
    public you: IPlayer;
    private score: Number;
    public totalScore: Number = 0;
    public time: Number;
    private qScoreMaxValue: number;
    public qScore: number;
    private qIndex: Number = 0;
    private q: any;
    public checkingAnswer: boolean = false;
    public answer: any;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private socket: SocketService,
                private rest: RestService) {
    }

    private doAnswer(answer: Array<any>) {
        this.checkingAnswer = true;

        this.socket.io().emit('answer', {
            game: this.game,
            player: this.you,
            q: {
                _id: this.q.id,
                answer: answer,
                index: this.qIndex
            }
        });
    }

    public answerQuestion() {
        // TODO: add checkbox support
        this.doAnswer([this.answer]);
    }

    public skipQuestion() {
        this.doAnswer([]);
    }

    private ngOnInit() {
        let self = this;

        self.route.params.subscribe((params: IPlayerRoomResponse) => {
            self.game = params.game;

            self.rest.getPlayer(params.player).subscribe((player: IPlayer) => {
                self.you = player;

                self.subscribe();
                self.getQuestion();
            })
        });
    }

    private subscribe() {
        let self: any = this;

        self.socket
            .io()
            .on('answerAccepted', (resp: any) => {
                // var modal = $uibModal.open({
                //     templateUrl: 'templates/answer.modal.html',
                //     controller: 'AnswerModalInstanceCtrl',
                //     controllerAs: 'vm',
                //     size: 'sm',
                //     resolve: {
                //         totalScore: resp.totalScore,
                //         isCorrect: resp.isCorrect
                //     }
                // });
                //
                // modal.result.then(function () {
                //     getQuestion();
                // });
                console.log('answer accepted');
                self.checkingAnswer = false;
            })
            .once('gameOver', (resp: any) => {
                // var modal = $uibModal.open({
                //     templateUrl: 'templates/game-over.modal.html',
                //     controller: 'GameOverModalInstanceCtrl',
                //     controllerAs: 'vm',
                //     size: 'sm',
                //     resolve: {
                //         player() {
                //             return resp.player;
                //         },
                //         game() {
                //             return resp.game;
                //         }
                //     }
                // });
                //
                // modal.result.then(function () {
                //     $state.go('scores', {
                //         game: vm.game
                //     });
                // });

                console.log('game over');
            })
            .on('receiveQuestion', (resp: IReceiveQuestionResponse) => {
                self.q = resp.question;
                self.qScoreMaxValue = self.qScore = resp.qScore;
                self.qScore = resp.qScore;
                self.totalScore = resp.totalScore;
                self.qIndex++;
            })
            .on('scoreCountdown', (resp: IScoreCountdownResponse) => {
                self.qScore = resp.score;
            });
    }

    private getQuestionScoreProgress(): Number {
        let progressValue = (this.qScore * 100) / this.qScoreMaxValue;

        return isNaN(progressValue) ? 100 : progressValue;
    }

    private getQuestion() {
        this.socket
            .io()
            .emit('getQuestion', {
                game: this.game,
                player: this.you,
                qIndex: this.qIndex
            });
    }
}
