import {Component} from "@angular/core";
import "./waiting-room.component.scss";
import {MD_CARD_DIRECTIVES} from "@angular2-material/card";
import {SocketService} from "../../services/socket.service";
import {ROUTER_DIRECTIVES, Router, ActivatedRoute} from "@angular/router";
import RestService from "../../services/rest.service";
import {
    IPlayerRoomResponse,
    IPlayer,
    IUpdateRoomResponse,
    ICountdownParams,
    IStartCountdownResponse
} from "../../util/app.Interfaces";
import * as _ from "lodash";
import {MD_BUTTON_DIRECTIVES} from "@angular2-material/button";
import {parse} from "url";
import {CountdownTimerComponent} from "../countdown-timer/countdown-timer.component";

@Component({
    selector: 'waiting-room',
    templateUrl: './waiting-room.component.html',
    directives: [
        ROUTER_DIRECTIVES,
        MD_CARD_DIRECTIVES,
        MD_BUTTON_DIRECTIVES,
        CountdownTimerComponent
    ]
})
export class WaitingRoomComponent {
    private game: String;
    private you: IPlayer;
    private players: Array<any>;
    public isPlayerReady: boolean = false;
    public countdown: ICountdownParams;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private socket: SocketService,
                private rest: RestService) {

        this.players = [];
        this.countdown = {
            enabled: false
        };

        this.subscribe();
    }

    private subscribe() {
        let self: any = this;

        self.socket.io()
            .on('updateRoom', (resp: IUpdateRoomResponse) => {
                self.players = resp.players;

                if (self.you.isAdmin) {
                    self.checkIfAllPlayersAreReady();
                }
            })
            .on('grantAdminRights', () => {
                self.you.isAdmin = true;
            })
            .on('startCountdown', (resp: IStartCountdownResponse) => {
                if (!this.countdown.enabled) {
                    this.countdown.enabled = true;
                }
                self.countdown.time = resp.counter;
            })
            .once('startTheBattle', () => {
                self.router.navigate(['/game', self.game, self.you._id]);
                self.countdown.enabled = false;
            });
    }

    ngOnInit() {
        let self = this;

        self.route.params.subscribe((params: IPlayerRoomResponse) => {
            self.game = params.game;

            self.rest.getPlayer(params.player).subscribe((player: IPlayer) => {
                self.you = player;

                self.refreshRoom();
            })
        });
    }

    public doReady() {
        this.isPlayerReady = true;
        this.socket.io().emit('playerIsReady', {game: this.game, player: this.you});
    }

    public copyLinkToJoinRoom() {
        let url = parse(window.location.href);
        let joinUrl = `${url.protocol}//${url.host}/join/${this.game}`;

        prompt('Copy invite link to clipboard: Ctrl + C, Enter', joinUrl);
    }

    private refreshRoom() {
        this.socket.io().emit('refreshRoom', {game: this.game});
    }

    private checkIfAllPlayersAreReady() {
        let allAreReady = _.filter(this.players, (player: IPlayer) => player.state === 'CONNECTED').length == 0;

        if (allAreReady) {
            this.socket.io().emit('allPlayersAreReady', {game: this.game});
        }
    }
}
