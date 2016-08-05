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
import {STATE_STATUS, STORAGE_KEYS} from "../../util/config.util";
import {EVENTS} from '../../util/shared-util.adapter';

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
    private game: string;
    private you: IPlayer;
    private players: Array<IPlayer>;
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
    }

    public doReady() {
        this.isPlayerReady = true;
        this.socket.io().emit(EVENTS.BE.PLAYER_IS_READY, {game: this.game, player: this.you});
    }

    public copyLinkToJoinRoom() {
        let url = parse(window.location.href);
        let joinUrl = `${url.protocol}//${url.host}/join/${this.game}`;

        prompt('Copy invite link to clipboard: Ctrl + C, Enter', joinUrl);
    }

    ngOnInit() {
        let self = this;

        self.route.params.subscribe((params: IPlayerRoomResponse) => {
            self.game = params.game;

            self.rest.getPlayer(params.player).subscribe((player: IPlayer) => {
                self.you = player;

                localStorage.setItem(STORAGE_KEYS.GAME, this.game);
                localStorage.setItem(STORAGE_KEYS.PLAYER, this.you._id);
                localStorage.setItem(STORAGE_KEYS.STATE, STATE_STATUS.WAITING);

                self.subscribe();
                self.refreshRoom();
            })
        });
    }

    private subscribe() {
        let self: any = this;

        self.socket.io()
            .on(EVENTS.FE.UPDATE_ROOM, (resp: IUpdateRoomResponse) => {
                self.players = resp.players;

                if (self.you.isAdmin) {
                    self.checkIfAllPlayersAreReady();
                }
            })
            .on(EVENTS.FE.GRANT_ADMIN_RIGHTS, () => {
                self.you.isAdmin = true;
            })
            .once(EVENTS.FE.PREPARE_GAME_ROOM, () => {
                this.countdown.enabled = true;
                localStorage.setItem(STORAGE_KEYS.STATE, STATE_STATUS.STARTED);
            })
            .on(EVENTS.FE.START_COUNTDOWN, (resp: IStartCountdownResponse) => {
                self.countdown.time = resp.counter;
            })
            .once(EVENTS.FE.START_BATTLE, () => {
                self.router.navigate(['/game', self.game, self.you._id]);
                self.countdown.enabled = false;
            });
    }

    private refreshRoom() {
        this.socket.io().emit(EVENTS.BE.REFRESH_ROOM, {game: this.game});
    }

    private checkIfAllPlayersAreReady() {
        let allAreReady = _.filter(this.players, (player: IPlayer) => player.state === 'CONNECTED').length == 0;

        if (allAreReady) {
            this.socket.io().emit(EVENTS.BE.ALL_PLAYERS_ARE_READY, {game: this.game});
        }
    }
}
