import uuid from 'uuid';
import Game from './models/Game';
import Question from './models/Question';
import Player from './models/Player';
import * as _ from 'lodash';
import ehs from './services/exception-handler.service';
import MongoDumpService from './services/mongo-dump.service';


const DO_MONGO_DUMP = false;
const COUNTDOWN_COUNT = 3;
const COUNTDOWN_DELAY = 1000;
const pSocketsScoreMap = {};

let self;
export default class GameModule {

    constructor(io, socket) {
        self = this;

        self.gameIo = io;
        self.gameSocket = socket;

        self.gameSocket.emit('connected', {message: "You are connected!"});
    }

    init() {
        self.gameSocket.on('createRoom', this.createRoomEvent);
        self.gameSocket.on('joinRoom', this.joinRoomEvent);
        self.gameSocket.on('refreshRoom', this.refreshRoom);
        self.gameSocket.on('playerIsReady', this.playerIsReadyEvent);
        self.gameSocket.on('allPlayersAreReady', this.allPlayersAreReady);
        self.gameSocket.on('getQuestion', this.getQuestionEvent);
        self.gameSocket.on('answer', this.answerEvent);
        self.gameSocket.on('getTableScore', this.getTableScore);

        if (DO_MONGO_DUMP) {
            MongoDumpService.doQuestionDump();
        }
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
                    ready: false,
                    isAdmin: true,
                    socket: sock.id,
                    score: 0,
                    finish: false
                }).save();

            }, ehs.validate)
            .then((player) => {
                // join the game (sock is a socket of joined player)
                sock.join(savedGame._id);

                // send event to FE, to the joined player
                sock.emit('roomCreated', {
                    game: savedGame._id,
                    you: player
                });

            }, ehs.validate);
    }

    /**
     * @this is a socket obj;
     */
    joinRoomEvent(data) {
        let sock = this;

        // If the game exists...
        if (!self.validateGameExistance(data.game, sock)) {
            return;
        }

        // create new player
        new Player({
                _id: uuid.v1({nsecs: 961}),
                name: data.username,
                game: data.game,
                ready: false,
                isAdmin: false,
                socket: sock.id,
                score: 0,
                finish: false
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

            }, ehs.validate);
    }

    /**
     * @this is a socket obj;
     */
    refreshRoom(data) {
        // find all players who belongs to this game
        Player.find({game: data.game})
            .then((players) => {

                // send event to all players from this game
                self.gameIo.sockets.in(data.game).emit('updateRoom', {
                    game: data.game,
                    players: players
                });

            }, ehs.validate);
    }

    /**
     * @this is a socket obj;
     */
    playerIsReadyEvent(data) {
        if (!self.validateGameExistance(data.game, this)) {
            return;
        }

        // find player with specific id and game and update his ready status
        Player.findOneAndUpdate({_id: data.player._id, game: data.game}, {$set: {ready: true}})
            .then(() => {

                // find all players from that game
                return Player.find({game: data.game});

            }, ehs.validate)
            .then((players) => {

                // send updated status to all players from the game
                self.gameIo.sockets.in(data.game).emit('updateRoom', {players: players});

            }, ehs.validate);
    }

    /**
     * @this is a socket obj;
     */
    allPlayersAreReady(data) {
        if (!self.validateGameExistance(data.game, this)) {
            return;
        }

        //TODO: implement ability to choose questions level
        Question.find({level: 1})
            .then((questions) => {

                return Game.findOneAndUpdate(
                    {_id: data.game},
                    {$set: {questions: self.get5RandomQuestionsIds(questions)}}
                );

            }, ehs.validate)
            .then((game) => {

                // start countdown
                return self.startCountdown(game);

            }, ehs.validate)
            .then(() => {
                // start game when countdown has been finished
                self.gameIo.sockets.in(data.game).emit('startTheBattle');
            });
    }

    /**
     * @this is a socket obj;
     */
    getQuestionEvent(req) {
        let self = this;

        Game.findOne({_id: req.game}).then(function (game) {
            ehs.assertNotNull(game);

            var qId = null;

            if (req.qIndex < game.questions.length) {
                qId = game.questions[req.qIndex];
            } else {
                ehs.validate(new Error("Wrong qIndex: " + req.qIndex));
            }

            //if it's a valid question index and there is next question
            if (qId != null) {

                Question.findOne({_id: qId}).then(function (question) {
                    var startScore = 60000;

                    Player.findOne({_id: req.player._id}).then(function (player) {

                        gameIo.sockets.in(game._id).sockets[player.socket].emit('receiveQuestion', {
                            question: {
                                id: question._id,
                                text: question.question,
                                possibleAnswers: question.possibleAnswers,
                                isRadio: question.isRadio
                            },
                            qScore: startScore,
                            totalScore: player.score
                        });

                        self.putScoreToMap(player.socket, startScore);

                        self.startScoreCountdown(game._id, player.socket, startScore);

                    }, ehs.validate);
                }, ehs.validate)
            }
        }, ehs.validate)
    }

    /**
     * @this is a socket obj;
     */
    answerEvent(req) {
        let self = this;

        pSocketsScoreMap[req.player.socket].inAction = false;

        Game.findOne({_id: req.game}).then(function (game) {
            ehs.assertNotNull(game);

            var pScore = pSocketsScoreMap[req.player.socket].score;
            var isCorrect = false;

            Question.findOne({_id: req.q._id}).then(function (question) {

                var answersIntersection = _.intersection(question.rightAnswers, req.q.answer);

                if (question.rightAnswers.length == answersIntersection.length) {
                    isCorrect = true;
                } else {
                    pScore = 0;
                }

                var hasMoreQuestions = !(req.q.index == game.questions.length);
                var updateDocument = {$inc: {score: pScore}};

                if (!hasMoreQuestions) {
                    updateDocument['$set'] = {finish: true};
                }

                Player.update({_id: req.player._id}, updateDocument)
                    .then(function () {
                        return Player.findOne({_id: req.player._id});
                    }, ehs.validate)
                    .then(function (player) {
                        pSocketsScoreMap[req.player.socket].score = 0;

                        if (hasMoreQuestions) {
                            //there are more questions
                            gameIo.sockets.in(req.game).sockets[req.player.socket].emit('answerAccepted', {
                                totalScore: player.score,
                                isCorrect: isCorrect
                            });
                        } else {
                            //this is the last question
                            gameIo.sockets.in(req.game).sockets[req.player.socket].emit('gameOver', {
                                totalScore: player.score,
                                player: player,
                                game: game
                            });

                            //send request to update score table data for other users
                            gameIo.sockets.in(req.game).emit('doRefreshCycle');
                        }
                    }, ehs.validate);
            }, ehs.validate);
        }, ehs.validate);
    }

    /**
     * @this is a socket obj;
     */
    getTableScore(req) {
        //TODO: check it
        var sock = this;

        Game.findOne({_id: req.game})
            .then(function (game) {
                ehs.assertNotNull(game);
                //TODO: this doesn't work.
                return q.all([
                    Player.count({_id: {$in: game.players}}),
                    Player.find({_id: {$in: game.players}, finish: true}),
                    Player.find({_id: {$in: game.players}})
                ])
            }, ehs.validate)
            .then(function (allPlayersCount, finishedPlayers) {
                //collect score table data
                var scoreTableData = _.map(players, function (player) {
                    return {
                        name: player.name,
                        score: player.score
                    }
                });

                var resp = {
                    players: scoreTableData
                };

                if (allPlayersCount === players.length) {
                    resp.winner = _.max(players, function (player) {
                        return player.score;
                    });
                }

                //send new data
                sock.emit('refreshScoreTable', resp);
            }, ehs.validate);
    }

    putScoreToMap(pSocket, score) {
        pSocketsScoreMap[pSocket] = {
            score: score,
            inAction: true
        }
    }

    startCountdown(game) {
        return new Promise((resolve) => {
            let count = COUNTDOWN_COUNT;

            let countdownFunc = () => {
                self.gameIo.sockets.in(game._id).emit('startCountdown', {counter: count});

                // decrement counter state
                count--;

                if (count > 0) {
                    setTimeout(countdownFunc, COUNTDOWN_DELAY);
                } else {
                    resolve();
                }
            };

            // start countdown function
            setTimeout(countdownFunc, COUNTDOWN_DELAY);
        });
    }

    startScoreCountdown(game, pSocket, score) {
        let self = this;

        setTimeout(function countdown() {
            score = score - 100;

            gameIo.sockets.in(game).sockets[pSocket].emit('scoreCountdown', {
                score: score
            });

            if (score > 0 && pSocketsScoreMap[pSocket].inAction) {
                setTimeout(countdown, 100);
            }

            self.putScoreToMap(pSocket, score);

        }, 100);
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
                let rIndex = Math.floor(Math.random() * (max + 1));
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

    doesGameExist(game) {
        // Look up the game ID in the Socket.IO manager object.
        return self.gameSocket.adapter.rooms[game];
    }

    validateGameExistance(game, sock) {
        if (!self.doesGameExist(game)) {
            sock.emit('error', {message: "This game does not exist anymore."});

            return false;
        }

        return true;
    }
}
