//noinspection JSFileReferences
import EVENTS from 'shared-util/event.constants.js';
//noinspection JSFileReferences
import PLAYER_CONST from 'shared-util/player.constants.js';
import * as _ from 'lodash';
import Game from '../models/Game';
import Player from '../models/Player';
import ExceptionHandlerService from '../services/exception-handler.service';
import * as log4js from 'log4js';

let self;
export default class RoomEventHandler {

    constructor(io, socket, ehs) {
        self = this;

        self.log = log4js.getLogger();
        self.io = io;
        self.ehs = ehs;

        socket.on(EVENTS.BE.CREATE_ROOM, this.createRoomEvent);
        socket.on(EVENTS.BE.JOIN_ROOM, this.joinRoomEvent);
        socket.on(EVENTS.BE.REFRESH_ROOM, this.refreshRoomEvent);
        socket.on(EVENTS.BE.GET_TABLE_SCORE, this.getTableScoreEvent);
    }

    /**
     * @this is a socket obj;
     */
    createRoomEvent(data) {
        let sock = this;
        let savedGame;

        // create a game instance
        new Game({
                questions: [],
                level: data.level ? data.level : 1
            })
            .save()
            .then((game) => {
                // save game instance to local scope
                savedGame = game;

                // create joined player and save it to db
                return new Player({
                    name: data.username,
                    game: game._id,
                    isAdmin: true,
                    socket: sock.id,
                    state: PLAYER_CONST.STATE.CONNECTED
                }).save();

            }, ExceptionHandlerService.validate)
            .then((player) => {
                // join the game (sock is a socket of joined player)
                sock.join(savedGame._id);

                // send event to FE, to the joined player
                sock.emit(EVENTS.FE.ROOM_CREATED, {
                    game: savedGame._id,
                    player: player._id
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

        // check if game is available now
        Game.findOne({_id: data.game})
            .then((game) => {
                if(game.available) {

                    // check player name
                    return Player.findOne({game: data.game, name: data.username});
                } else {
                    throw new Error("Game isn't available!")
                }
            })
            .then((player) => {
                // if player with this name exists then throw the error
                if (player) {
                    throw new Error('Player with this name already exists.');
                }

                // create new player
                return new Player({
                    name: data.username,
                    game: data.game,
                    socket: sock.id,
                    state: PLAYER_CONST.STATE.CONNECTED
                }).save();
            })
            .then((player) => {
                // join the new player to the game
                sock.join(data.game);

                // send event to all players from this game
                self.io.sockets.in(data.game).emit(EVENTS.FE.PLAYER_JOINED, {
                    game: data.game,
                    player: player._id
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
        Player.find({game: data.game, state: {$ne: PLAYER_CONST.STATE.DISCONNECTED}})
            .then((players) => {

                // send event to all players from this game
                self.io.sockets.in(data.game).emit(EVENTS.FE.UPDATE_ROOM, {
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

        // join this game, because everyone can come here
        sock.join(data.game);

        Player.find({game: data.game})
            .then((players) => {

                // find players who finished the game or disconnected players
                let finishedPlayers = _.filter(players, (player) => {
                    return player.state === PLAYER_CONST.STATE.FINISHED || player.state === PLAYER_CONST.STATE.DISCONNECTED;
                });

                //collect score table data
                let scoreTableData = _.map(finishedPlayers, (player) => {
                    return {
                        name: player.name,
                        score: player.score,
                        state: player.state
                    }
                });

                // create resp object
                let resp = {
                    players: scoreTableData
                };

                // if all players finished the game then we're gonna look for the winner
                if (players.length === finishedPlayers.length) {
                    //TODO: right now even if player disconnected but he had more scores then other players he will win that game
                    resp.winner = _.maxBy(players, (player) => player.score);
                }

                //send new data
                sock.emit(EVENTS.FE.REFRESH_SCORE_TABLE, resp);

            }, ExceptionHandlerService.validate)
            .catch((err) => {
                ExceptionHandlerService.emitError(sock, err);
            });
    }
}
