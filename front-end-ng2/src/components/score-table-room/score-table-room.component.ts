import {Component, OnInit} from "@angular/core";
import "./score-table-room.component.scss";
import {MD_CARD_DIRECTIVES} from "@angular2-material/card";
import {SocketService} from "../../services/socket.service";
import {ROUTER_DIRECTIVES, Router, ActivatedRoute} from "@angular/router";
import {IPlayer, IGameResponse, IScoreTableResponse} from "../../util/app.Interfaces";
import {MD_BUTTON_DIRECTIVES} from "@angular2-material/button";

@Component({
    selector: 'score-table-room',
    templateUrl: './score-table-room.component.html',
    directives: [
        ROUTER_DIRECTIVES,
        MD_CARD_DIRECTIVES,
        MD_BUTTON_DIRECTIVES,
    ]
})
export class ScoreTableRoomComponent implements OnInit {
    public game: String;
    public players: Array<IPlayer>;
    public winner: IPlayer;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private socket: SocketService) {

        this.players = [];
    }

    public playAgain() {
        this.router.navigate(['/']);
    }

    ngOnInit(): any {
        let self = this;

        self.route.params.subscribe((params: IGameResponse) => {
            self.game = params.game;

            self.subscribe();

            self.refresh();
        });
    }

    private subscribe() {
        let self = this;

        self.socket
            .connect()
            .on('refreshScoreTable', (resp: IScoreTableResponse) => {
                self.players = resp.players;
                self.winner = resp.winner;
            })
            .on('doRefreshCycle', () => {
                self.refresh();
            });
    }

    private refresh() {
        this.socket.io().emit('getTableScore', {game: this.game});
    }
}
