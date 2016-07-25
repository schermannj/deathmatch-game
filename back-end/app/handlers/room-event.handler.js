import uuid from 'uuid';
import * as _ from 'lodash';
import Game from '../models/Game';
import Player from '../models/Player';
import ExceptionHandlerService from '../services/exception-handler.service';
import {STATE} from '../config/constants'

let self;
export default class RoomEventHandler {

    constructor(gameIo, gameSocket, ehs) {
        self = this;

        self.gameIo = gameIo;
        self.ehs = ehs;

        gameSocket.on('createRoom', this.createRoomEvent);
        gameSocket.on('joinRoom', this.joinRoomEvent);
        gameSocket.on('refreshRoom', this.refreshRoomEvent);
        gameSocket.on('getTableScore', this.getTableScoreEvent);
    }

    /**
     * @this is a socket obj;
     */
    createRoomEvent(data) {
        let sock = this;
        let savedGame;

        // create a game instance
        new Game({
                _id: uuid.v1({nsecs: 961}),
                questions: [],
                level: data.level ? data.level : 1
            })
            .save()
            .then((game) => {
                // save game instance to local scope
                savedGame = game;

                // create joined player and save it to db
                return new Player({
                    _id: uuid.v1({nsecs: 961}),
                    name: data.username,
                    game: game._id,
                    isAdmin: true,
                    socket: sock.id,
                    state: STATE.CONNECTED
                }).save();

            }, ExceptionHandlerService.validate)
            .then((player) => {
                // join the game (sock is a socket of joined player)
                sock.join(savedGame._id);

                // send event to FE, to the joined player
                sock.emit('roomCreated', {
                    game: savedGame._id,
                    you: player
                });

            }, ExceptionHandlerService.validate)
            .catch((err) => {
                ExceptionHandlerService.emitError(sock, err);
            });
    }

    /**
     * @this is a socket obj;
     */
    joinRoomEvent(data) {
        let sock = this;

        // If the game exists...
        if (!self.ehs.validateGameExistence(data.game, sock)) {
            return;
        }

        // create new player
        new Player({
                _id: uuid.v1({nsecs: 961}),
                name: data.username,
                game: data.game,
                socket: sock.id,
                state: STATE.CONNECTED
            })
            .save()
            .then((player) => {
                // join the new player to the game
                sock.join(data.game);

                // send event to all players from this game
                self.gameIo.sockets.in(data.game).emit('playerJoined', {
                    game: data.game,
                    you: player
                });

            }, ExceptionHandlerService.validate)
            .catch((err) => {
                ExceptionHandlerService.emitError(sock, err);
            });
    }

    /**
     * @this is a socket obj;
     */
    refreshRoomEvent(data) {
        let sock = this;

        // find all players who belongs to this game
        Player.find({game: data.game})
            .then((players) => {

                // send event to all players from this game
                self.gameIo.sockets.in(data.game).emit('updateRoom', {
                    game: data.game,
                    players: players
                });

            }, ExceptionHandlerService.validate)
            .catch((err) => {
                ExceptionHandlerService.emitError(sock, err);
            });
    }

    /**
     * @this is a socket obj;
     */
    getTableScoreEvent(data) {
        let sock = this;

        if (!self.ehs.validateGameExistence(data.game, sock)) {
            return;
        }

        Player.find({game: data.game})
            .then((players) => {

                // find players who finished the game or disconnected players
                let finishedPlayers = _.filter(players, (player) => player.finish || player.disconnected);

                //collect score table data
                let scoreTableData = _.map(finishedPlayers, (player) => {
                    return {
                        name: player.name,
                        score: player.score,
                        disconnected: player.disconnected
                    }
                });

                // create resp object
                let resp = {
                    players: scoreTableData
                };

                // if all players finished the game then we're gonna look for the winner
                if (players.length === finishedPlayers.length) {
                    resp.winner = _.max(players, (player) => player.score);
                }

                //send new data
                sock.emit('refreshScoreTable', resp);

            }, ExceptionHandlerService.validate)
            .catch((err) => {
                ExceptionHandlerService.emitError(sock, err);
            });
    }
}
