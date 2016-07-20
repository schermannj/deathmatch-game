var uuid = require('uuid');
var Game = require('./models/Game').Game;
var Question = require('./models/Question').Question;
var Player = require('./models/Player').Player;
var _ = require('underscore');
var q = require('q');
var ExceptionHandlerService = require('./services/exception-handler.service'),
    ehs = new ExceptionHandlerService();
var doMongoDump = require('./services/mongo-dump.service');

var gameIo;
var gameSocket;

var pSocketsScoreMap = {};

module.exports = function (io, socket) {
    gameIo = io;
    gameSocket = socket;

    gameSocket.emit('connected', {message: "You are connected!"});

    //events
    gameSocket.on('createRoom', createRoomEvent);
    gameSocket.on('joinRoom', joinRoomEvent);
    gameSocket.on('refreshRoom', refreshRoom);
    gameSocket.on('playerIsReady', playerIsReadyEvent);
    gameSocket.on('allPlayersAreReady', allPlayersAreReady);
    gameSocket.on('getQuestion', getQuestionEvent);
    gameSocket.on('answer', answerEvent);
    gameSocket.on('getTableScore', getTableScore);
};

function createRoomEvent(data) {
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

function joinRoomEvent(data) {
    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the game ID in the Socket.IO manager object.
    var game = gameSocket.adapter.rooms[data.game];

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

                    gameIo.sockets.in(data.game).emit('playerJoined', {
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

function refreshRoom(req) {
    Game.findOne({_id: req.game}).then(function (game) {

        getPlayers(game).then(function (players) {

            gameIo.sockets.in(req.game).emit('updateRoom', {
                game: game._id,
                players: players
            });
        }, ehs.validate);
    }, ehs.validate);
}

function playerIsReadyEvent(data) {
    Game.findOne({_id: data.game}).then(function (game) {

        if (_.contains(game.players, data.player._id)) {

            Player.findOneAndUpdate({_id: data.player._id}, {$set: {ready: true}}).then(function () {

                getPlayers(game).then(function (players) {

                    gameIo.sockets.in(game._id).emit('updateRoom', {players: players});

                }, ehs.validate);
            }, ehs.validate);
        }
    }, ehs.validate)
}

function allPlayersAreReady(data) {
    //TODO: implement ability to choose levels
    loadQuestionsForGame(1)
        .then(function (questions) {

            return Game.findOneAndUpdate(
                {_id: data.game},
                {$set: {questions: get5RandomQuestionsIds(questions)}}
            )

        }, ehs.validate)
        .then(function (game) {

            startCountdown(game).then(function () {
                gameIo.sockets.in(game._id).emit('startTheBattle');
            })

        }, ehs.validate);
}

function getQuestionEvent(req) {
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

                    putScoreToMap(player.socket, startScore);

                    startScoreCountdown(game._id, player.socket, startScore);

                }, ehs.validate);
            }, ehs.validate)
        }
    }, ehs.validate)
}

function answerEvent(req) {
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

function getTableScore(req) {
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

function getPlayers(game) {
    return Player.find({_id: {$in: game.players}});
}

function putScoreToMap(pSocket, score) {
    pSocketsScoreMap[pSocket] = {
        score: score,
        inAction: true
    }
}

function startCountdown(game) {
    var deferred = q.defer();

    var count = 3;

    setTimeout(function countdown() {
        gameIo.sockets.in(game._id).emit('startCountdown', {counter: count});

        count--;

        if (count > 0) {
            setTimeout(countdown, 1000);
        } else {
            deferred.resolve();
        }
    }, 1000);

    return deferred.promise;
}

function startScoreCountdown(game, pSocket, score) {
    setTimeout(function countdown() {
        score = score - 100;

        gameIo.sockets.in(game).sockets[pSocket].emit('scoreCountdown', {
            score: score
        });

        if (score > 0 && pSocketsScoreMap[pSocket].inAction) {
            setTimeout(countdown, 100);
        }

        putScoreToMap(pSocket, score);

    }, 100);
}

function loadQuestionsForGame(level) {
    return Question.find({level: level});
}

function get5RandomQuestionsIds(questions) {
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