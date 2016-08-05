//noinspection JSFileReferences
import EVENTS from 'shared-util/event.constants.js';
//noinspection JSFileReferences
import PLAYER_CONST from 'shared-util/player.constants.js';
import * as _ from 'lodash';
import Game from '../models/Game';
import Question from '../models/Question';
import Player from '../models/Player';
import ExceptionHandlerService from '../services/exception-handler.service';
import {COUNTDOWN_COUNT, COUNTDOWN_DELAY} from "../config/constants";
import * as log4js from 'log4js';
import {QUESTION_PER_GAME} from "../config/constants";

let self;
export default class PlayerEventHandler {

    constructor(io, socket, ehs, psh) {
        self = this;

        self.log = log4js.getLogger();
        self.io = io;
        self.ehs = ehs;
        self.psh = psh;

        socket.on(EVENTS.BE.DISCONNECT, this.playerLeaveEvent);
        socket.on(EVENTS.BE.PLAYER_IS_READY, this.playerIsReadyEvent);
        socket.on(EVENTS.BE.ALL_PLAYERS_ARE_READY, this.allPlayersAreReadyEvent);
        socket.on(EVENTS.BE.RECONNECT, this.reconnectPlayer);
    }

    /**
     * @this is a socket obj;
     */
    playerIsReadyEvent(data) {
        let sock = this;

        if (!self.ehs.validateGameExistence(data.game, this)) {
            return;
        }

        // find player with specific id and game and update his ready status
        Player.findOneAndUpdate({_id: data.player._id, game: data.game}, {$set: {state: PLAYER_CONST.STATE.READY}})
            .then(() => {

                // find all players from that game who isn't disconnected
                return Player.find(
                    {game: data.game, $or: [{state: PLAYER_CONST.STATE.READY}, {state: PLAYER_CONST.STATE.CONNECTED}]}
                );

            }, ExceptionHandlerService.validate)
            .then((players) => {

                // send updated status to all active players from the game
                self.io.sockets.in(data.game).emit(EVENTS.FE.UPDATE_ROOM, {players: players});

            }, ExceptionHandlerService.validate)
            .catch((err) => {
                ExceptionHandlerService.emitError(sock, err);
            });
    }

    /**
     * @this is a socket obj;
     */
    allPlayersAreReadyEvent(data) {
        let sock = this;

        if (!self.ehs.validateGameExistence(data.game, this)) {
            return;
        }

        // make game unavailable
        Game.update({_id: data.game}, {$set: {available: false}})
            .then(() => {
                // set players' states to 'STARTED'
                return Player.update(
                    {game: data.game, state: {$ne: PLAYER_CONST.STATE.DISCONNECTED}},
                    {$set: {state: PLAYER_CONST.STATE.STARTED}},
                    {multi: true}
                );
            })
            .then(() => {
                //TODO: implement ability to choose questions level
                // find all questions for a specific level
                return Question.find({level: 1});

            }, ExceptionHandlerService.validate)
            .then((questions) => {
                let gameQuestions = self.getRandomQuestionsIds(questions);
                let firstQuestion = gameQuestions.shift();

                // save 5 random selected questions to all players' objects and set first question to each player
                return Player.update(
                    {game: data.game},
                    {
                        $set: {
                            questions: gameQuestions,
                            currentQuestion: {
                                id: firstQuestion,
                                score: PLAYER_CONST.PLAYER_START_SCORE
                            }
                        }
                    },
                    {multi: true});

            }, ExceptionHandlerService.validate)
            .then(() => {
                // notify FE about game event
                self.io.sockets.in(data.game).emit(EVENTS.FE.PREPARE_GAME_ROOM);

                // start countdown
                return self.startCountdown(data.game);

            }, ExceptionHandlerService.validate)
            .then(() => {
                // start game when countdown has been finished
                self.io.sockets.in(data.game).emit(EVENTS.FE.START_BATTLE);

            }, ExceptionHandlerService.validate)
            .catch((err) => {
                ExceptionHandlerService.emitError(sock, err);
            });
    }

    /**
     * @this is a socket obj;
     */
    playerLeaveEvent() {
        let sock = this;

        self.log.debug(`Player disconnected. Socket - ${sock.id}`);

        // stop score countdown if it's possible
        self.psh.setInAction(sock.id, false);

        // try to get player question score
        let score = self.psh.getScore(sock.id);

        // set player's score to question state and update player
        let setObj = {state: PLAYER_CONST.STATE.DISCONNECTED};
        if (score) {
            setObj['currentQuestion.score'] = score;
        }

        // update disconnected player and set disconnect status to 'true'
        Player
            .findOneAndUpdate(
                {socket: this.id, state: {$ne: PLAYER_CONST.STATE.FINISHED}},
                {$set: setObj},
                {new: true}
            )
            .then((disconnectedPlayer) => {

                // if game doesn't exist - ignore it.
                // if (!self.ehs.doesGameExist(disconnectedPlayer.game)) {
                //     throw new Error('Game doesn\'t exist!')
                // }

                self.log.debug(`PlayerEventHandler: player disconnected. Socket - ${sock.id}. Player id - ${disconnectedPlayer._id}`);

                // find all players who didn't leave the game
                return Player.find({game: disconnectedPlayer.game, state: {$ne: PLAYER_CONST.STATE.DISCONNECTED}});

            }, ExceptionHandlerService.validate)
            .then((players) => {
                // if game didn't start, then send event to wait-room, else to score-table-room
                let didGameStart = _.find(players, (player) => {
                    return player.state === PLAYER_CONST.STATE.STARTED || player.state === PLAYER_CONST.STATE.FINISHED;
                });

                if (didGameStart) {
                    // emit an event and update score table data for all finished players from this game.
                    // actually I emit to all players from the game but only the one who finished the game
                    // subscribed on that event
                    self.io.sockets.in(didGameStart.game).emit(EVENTS.FE.DO_REFRESH_CYCLE);
                } else if (players && players.length > 0) {
                    let game = players[0].game;

                    // if admin leave the game then find new player and give him admin rights
                    let isThereAdmin = _.some(players, ['isAdmin', true]);

                    if (!isThereAdmin) {
                        return Player.findOneAndUpdate(
                            {game: game, state: {$ne: PLAYER_CONST.STATE.DISCONNECTED}}, {$set: {isAdmin: true}}
                        );
                    } else {
                        // if there are some players and game didn't start, send them an event and update room
                        self.io.sockets.in(game).emit(EVENTS.FE.UPDATE_ROOM, {players: players});
                    }
                }
            }, ExceptionHandlerService.validate)
            .then((admin) => {
                // emit event to new admin and give him access rights
                if (admin) {
                    self.io.to(admin.socket).emit(EVENTS.FE.GRANT_ADMIN_RIGHTS);
                }
            })
            .catch((err) => {
                self.log.debug(err.message);
            });
    }

    /**
     * @this is a socket obj;
     */
    reconnectPlayer(data) {
        let sock = this;

        // find all connected players from this game
        Player
            .find({game: data.game, state: {$ne: PLAYER_CONST.STATE.DISCONNECTED}})
            .then((players) => {

                let setObj = {socket: sock.id, state: data.state};

                // take away admin access rights if there are more players
                if (players.length >= 1) {
                    setObj.isAdmin = false;
                }

                // update disconnected player and set to him status CONNECTED, new sock id
                return Player.findOneAndUpdate({_id: data.player, game: data.game}, {$set: setObj}, {new: true});
            })
            .then((player) => {

                self.log.debug(`PlayerEventHandler: player reconnected. Socket - ${sock.id}. Player id - ${player._id}`);

                // if player updated successfully -> join the game
                sock.join(player.game);

                // notify FE that player successfully joined the game
                sock.emit(EVENTS.FE.PLAYER_RECONNECTED);
            }, ExceptionHandlerService.validate)
            .catch((err) => {
                self.log.debug(err.message);
            })
    }

    startCountdown(game) {
        return new Promise((resolve) => {
            let count = COUNTDOWN_COUNT;

            let countdownFunc = () => {
                self.io.sockets.in(game).emit(EVENTS.FE.START_COUNTDOWN, {counter: count});

                // decrement counter state
                count--;

                if (count >= 0) {
                    setTimeout(countdownFunc, COUNTDOWN_DELAY);
                } else {
                    resolve();
                }
            };

            // start countdown function
            setTimeout(countdownFunc, COUNTDOWN_DELAY);
        });
    }

    getRandomQuestionsIds(questions) {
        if (questions.length <= QUESTION_PER_GAME) {

            return _.map(questions, (q) => {
                return q._id;
            });

        } else {

            let randomQuestions = [];

            while (randomQuestions.length < QUESTION_PER_GAME) {
                let rIndex = Math.floor(Math.random() * QUESTION_PER_GAME);
                let rQuestionId = questions[rIndex]._id;
                let found = false;

                for (let i = 0; i < randomQuestions.length; i++) {
                    if (randomQuestions[i] === rQuestionId) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    randomQuestions.push(rQuestionId);
                }
            }

            return randomQuestions;
        }
    }
}