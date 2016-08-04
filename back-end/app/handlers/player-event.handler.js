import * as _ from 'lodash';
import Game from '../models/Game';
import Question from '../models/Question';
import Player from '../models/Player';
import ExceptionHandlerService from '../services/exception-handler.service';
import {STATE, COUNTDOWN_COUNT, COUNTDOWN_DELAY} from "../config/constants";
import * as log4js from 'log4js';

let self;
export default class PlayerEventHandler {

    constructor(gameIo, gameSocket, ehs) {
        self = this;

        self.log = log4js.getLogger();
        self.gameIo = gameIo;
        self.ehs = ehs;

        gameSocket.on('disconnect', this.playerLeaveEvent);
        gameSocket.on('playerIsReady', this.playerIsReadyEvent);
        gameSocket.on('allPlayersAreReady', this.allPlayersAreReadyEvent);
        gameSocket.on('reconnectPlayer', this.reconnectPlayer);
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
        Player.findOneAndUpdate({_id: data.player._id, game: data.game}, {$set: {state: STATE.READY}})
            .then(() => {

                // find all players from that game who isn't disconnected
                return Player.find({game: data.game, $or: [{state: STATE.READY}, {state: STATE.CONNECTED}]});

            }, ExceptionHandlerService.validate)
            .then((players) => {

                // send updated status to all active players from the game
                self.gameIo.sockets.in(data.game).emit('updateRoom', {players: players});

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
                    {game: data.game, state: {$ne: STATE.DISCONNECTED}},
                    {$set: {state: STATE.STARTED}},
                    {multi: true}
                );
            })
            .then(() => {
                //TODO: implement ability to choose questions level
                // find all questions for a specific level
                return Question.find({level: 1});

            }, ExceptionHandlerService.validate)
            .then((questions) => {

                // save 5 random selected questions to the game object
                return Game.findOneAndUpdate(
                    {_id: data.game},
                    {$set: {questions: self.get5RandomQuestionsIds(questions)}}
                );

            }, ExceptionHandlerService.validate)
            .then((game) => {
                // notify FE about game event
                self.gameIo.sockets.in(data.game).emit('prepareGameRoom');

                // start countdown
                return self.startCountdown(game);

            }, ExceptionHandlerService.validate)
            .then(() => {
                // start game when countdown has been finished
                self.gameIo.sockets.in(data.game).emit('startTheBattle');

            }, ExceptionHandlerService.validate)
            .catch((err) => {
                ExceptionHandlerService.emitError(sock, err);
            });
    }

    /**
     * @this is a socket obj;
     */
    playerLeaveEvent() {
        // update disconnected player and set disconnect status to 'true'
        Player
            .findOneAndUpdate(
                {socket: this.id, state: {$ne: STATE.FINISHED}},
                {$set: {state: STATE.DISCONNECTED}},
                {new: true}
            )
            .then((disconnectedPlayer) => {

                // if game doesn't exist - ignore it.
                if (!self.ehs.doesGameExist(disconnectedPlayer.game)) {
                    return;
                }

                // find all players who didn't leave the game
                return Player.find({game: disconnectedPlayer.game, state: {$ne: STATE.DISCONNECTED}});

            }, ExceptionHandlerService.validate)
            .then((players) => {
                // if game didn't start, then send event to wait-room, else to score-table-room
                let didGameStart = _.find(players, (player) => {
                    return player.state === STATE.STARTED || player.state === STATE.FINISHED;
                });

                if (didGameStart) {
                    // find finished players
                    let finishedPlayers = _.filter(players, (player) => {
                        return player.state === STATE.FINISHED;
                    });

                    // emit an event and update score table data for all finished players from this game
                    for (let player of finishedPlayers) {
                        self.gameIo.to(player.socket).emit('doRefreshCycle');
                    }
                } else if (players.length > 0) {
                    let game = players[0].game;

                    // if admin leave the game then find new player and give him admin rights
                    let isThereAdmin = _.some(players, ['isAdmin', true]);

                    if (!isThereAdmin) {
                        return Player.findOneAndUpdate(
                            {game: game, state: {$ne: STATE.DISCONNECTED}}, {$set: {isAdmin: true}}
                        );
                    } else {
                        // if there are some players and game didn't start, send them an event and update room
                        self.gameIo.sockets.in(game).emit('updateRoom', {players: players});
                    }
                }
            }, ExceptionHandlerService.validate)
            .then((admin) => {
                // emit event to new admin and give him access rights
                if (admin) {
                    self.gameIo.to(admin.socket).emit('grantAdminRights');
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
            .find({game: data.game, state: {$ne: STATE.DISCONNECTED}})
            .then((players) => {

                let setObj = {socket: sock.id, state: STATE.CONNECTED};

                // take away admin access rights if there are more players
                if (players.length >= 1) {
                    setObj.isAdmin = false;
                }

                // update disconnected player and set to him status CONNECTED, new sock id
                return Player.findOneAndUpdate({_id: data.player, game: data.game}, {$set: setObj}, {new: true});
            })
            .then((player) => {
                // if player updated successfully -> join the game
                sock.join(player.game);

                // notify FE that player successfully joined the game
                sock.emit('playerReconnected');
            }, ExceptionHandlerService.validate)
            .catch((err) => {
                self.log.debug(err.message);
            })
    }

    startCountdown(game) {
        return new Promise((resolve) => {
            let count = COUNTDOWN_COUNT;

            let countdownFunc = () => {
                self.gameIo.sockets.in(game._id).emit('startCountdown', {counter: count});

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

    get5RandomQuestionsIds(questions) {
        if (questions.length <= 5) {

            return _.map(questions, (q) => {
                return q._id;
            });

        } else {

            let randomQuestions = [];
            let max = questions.length;

            while (randomQuestions.length < 5) {
                let rIndex = Math.floor(Math.random() * max);
                let rQuestionId = questions[rIndex]._id;
                let found = false;

                for (let i = 0; i < randomQuestions.length; i++) {
                    if (randomQuestions[i]._id == rQuestionId) {
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