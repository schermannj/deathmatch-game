import uuid from 'uuid';
import Game from './models/Game';
import Question from './models/Question';
import Player from './models/Player';
import * as _ from 'lodash';
import ExceptionHandlerService from './services/exception-handler.service';
import doMongoDump from './services/mongo-dump.service';

let ehs = new ExceptionHandlerService();

// let gameIo;
// let gameSocket;
const pSocketsScoreMap = {};

export default class GameModule {

    constructor(io, socket) {
        this.gameIo = io;
        this.gameSocket = socket;

        this.gameSocket.emit('connected', {message: "You are connected!"});
    }

    init() {
        this.gameSocket.on('createRoom', this.createRoomEvent);
        this.gameSocket.on('joinRoom', this.joinRoomEvent);
        this.gameSocket.on('refreshRoom', this.refreshRoom);
        this.gameSocket.on('playerIsReady', this.playerIsReadyEvent);
        this.gameSocket.on('allPlayersAreReady', this.allPlayersAreReady);
        this.gameSocket.on('getQuestion', this.getQuestionEvent);
        this.gameSocket.on('answer', this.answerEvent);
        this.gameSocket.on('getTableScore', this.getTableScore);
    }

    createRoomEvent(data) {
        //TODO: check it
        var sock = this;

        doMongoDump(false);

        new Player({
            _id: uuid.v1({nsecs: 961}),
            name: data.username,
            ready: false,
            isAdmin: true,
            socket: sock.id,
            score: 0,
            finish: false
        }).save()
            .then(function (player) {

                return new Game({
                        _id: uuid.v1({nsecs: 961}),
                        players: [
                            player._id
                        ],
                        questions: [],
                        level: data.level ? data.level : 1
                    }
                ).save()
                    .then(function (game) {
                        // Join the Game and wait for the players
                        sock.join(game._id);

                        sock.emit('roomCreated', {
                            game: game._id,
                            you: player
                        });
                    }, ehs.validate);
            }, ehs.validate)
    }

    joinRoomEvent(data) {
        let self = this;
        // A reference to the player's Socket.IO socket object
        //TODO: check it, seems like smth strange
        var sock = this;

        // Look up the game ID in the Socket.IO manager object.
        var game = self.gameSocket.adapter.rooms[data.game];

        // If the game exists...
        if (game) {
            //create new player
            new Player({
                _id: uuid.v1({nsecs: 961}),
                name: data.username,
                ready: false,
                isAdmin: false,
                socket: sock.id,
                score: 0,
                finish: false
            }).save()
                .then(function (nextPlayer) {
                    Game.findOneAndUpdate(
                        {_id: data.game},
                        {
                            $push: {players: nextPlayer._id}
                        },
                        {"new": true}
                    ).then(function (game) {
                        // Join the game
                        sock.join(data.game);

                        self.gameIo.sockets.in(data.game).emit('playerJoined', {
                            game: game._id,
                            you: nextPlayer
                        });
                    }, ehs.validate);
                }, ehs.validate);
        } else {
            // Otherwise, send an error message back to the player.
            this.emit('error', {message: "This game does not exist."});
        }
    }

    refreshRoom(req) {
        let self = this;

        Game.findOne({_id: req.game}).then(function (game) {

            self.getPlayers(game).then(function (players) {

                self.gameIo.sockets.in(req.game).emit('updateRoom', {
                    game: game._id,
                    players: players
                });
            }, ehs.validate);
        }, ehs.validate);
    }

    playerIsReadyEvent(data) {
        let self = this;

        Game.findOne({_id: data.game}).then(function (game) {

            if (_.contains(game.players, data.player._id)) {

                Player.findOneAndUpdate({_id: data.player._id}, {$set: {ready: true}}).then(function () {

                    self.getPlayers(game).then(function (players) {

                        self.gameIo.sockets.in(game._id).emit('updateRoom', {players: players});

                    }, ehs.validate);
                }, ehs.validate);
            }
        }, ehs.validate)
    }

    allPlayersAreReady(data) {
        let self = this;

        //TODO: implement ability to choose levels
        self.loadQuestionsForGame(1)
            .then(function (questions) {

                return Game.findOneAndUpdate(
                    {_id: data.game},
                    {$set: {questions: self.get5RandomQuestionsIds(questions)}}
                )

            }, ehs.validate)
            .then(function (game) {

                self.startCountdown(game).then(function () {
                    self.gameIo.sockets.in(game._id).emit('startTheBattle');
                })

            }, ehs.validate);
    }

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

                        self.gameIo.sockets.in(game._id).sockets[player.socket].emit('receiveQuestion', {
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
                            self.gameIo.sockets.in(req.game).sockets[req.player.socket].emit('answerAccepted', {
                                totalScore: player.score,
                                isCorrect: isCorrect
                            });
                        } else {
                            //this is the last question
                            self.gameIo.sockets.in(req.game).sockets[req.player.socket].emit('gameOver', {
                                totalScore: player.score,
                                player: player,
                                game: game
                            });

                            //send request to update score table data for other users
                            self.gameIo.sockets.in(req.game).emit('doRefreshCycle');
                        }
                    }, ehs.validate);
            }, ehs.validate);
        }, ehs.validate);
    }

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

    getPlayers(game) {
        return Player.find({_id: {$in: game.players}});
    }

    putScoreToMap(pSocket, score) {
        pSocketsScoreMap[pSocket] = {
            score: score,
            inAction: true
        }
    }

    startCountdown(game) {
        let self = this;

        var deferred = q.defer();

        var count = 3;

        setTimeout(function countdown() {
            self.gameIo.sockets.in(game._id).emit('startCountdown', {counter: count});

            count--;

            if (count > 0) {
                setTimeout(countdown, 1000);
            } else {
                deferred.resolve();
            }
        }, 1000);

        return deferred.promise;
    }

    startScoreCountdown(game, pSocket, score) {
        let self = this;

        setTimeout(function countdown() {
            score = score - 100;

            self.gameIo.sockets.in(game).sockets[pSocket].emit('scoreCountdown', {
                score: score
            });

            if (score > 0 && pSocketsScoreMap[pSocket].inAction) {
                setTimeout(countdown, 100);
            }

            self.putScoreToMap(pSocket, score);

        }, 100);
    }

    loadQuestionsForGame(level) {
        return Question.find({level: level});
    }

    get5RandomQuestionsIds(questions) {
        if (questions.length <= 5) {

            return _.map(questions, function (q) {
                return q._id;
            });

        } else {

            var randomQuestions = [];
            var max = questions.length;

            while (randomQuestions.length < 5) {
                var rIndex = Math.floor(Math.random() * (max + 1));
                var rQuestionId = questions[rIndex]._id;
                var found = false;

                for (var i = 0; i < randomQuestions.length; i++) {
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
