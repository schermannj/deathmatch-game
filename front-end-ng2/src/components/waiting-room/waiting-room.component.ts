import {Component} from "@angular/core";
import "./waiting-room.component.scss";
import {MD_TOOLBAR_DIRECTIVES} from "@angular2-material/toolbar";
import {MD_CARD_DIRECTIVES} from "@angular2-material/card";
import {SocketService} from "../../services/socket.service";
import {ROUTER_DIRECTIVES, Router, ActivatedRoute} from "@angular/router";
import RestService from "../../services/rest.service";
import {IPlayerJoinedRoomResponse, IPlayer, IUpdateRoomResponse} from "../../util/app.Interfaces";
import * as _ from 'lodash';
import {MD_BUTTON_DIRECTIVES} from "@angular2-material/button";
import {parse} from 'url'

@Component({
    selector: 'waiting-room',
    templateUrl: './waiting-room.component.html',
    directives: [ROUTER_DIRECTIVES, MD_CARD_DIRECTIVES, MD_TOOLBAR_DIRECTIVES, MD_BUTTON_DIRECTIVES]
})
export class WaitingRoomComponent {
    private game: String;
    private you: IPlayer;
    private players: Array<any>;
    public isPlayerReady: boolean = false;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private socket: SocketService,
                private rest: RestService) {

        this.players = [];

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
            .on('startCountdown', (resp: any) => {
                // $('.container').append('<h3>Game will start in ' + resp.counter + ' !</h3>')
                console.log(resp.counter)
            })
            .once('startTheBattle', () => {
                // $state.go('game', {
                //     player: vm.you,
                //     game: vm.game
                // })
                console.log('startTheBattle');
            });
    }

    ngOnInit() {
        this.route.params.subscribe((params: IPlayerJoinedRoomResponse) => {
            this.game = params.game;

            this.rest.getPlayer(params.player).subscribe((player: IPlayer) => {
                this.you = player;

                this.refreshRoom();
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
