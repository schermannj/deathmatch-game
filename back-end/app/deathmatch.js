var uuid = require('uuid');
var Game = require('./models/Game').Game;
var Question = require('./models/Question').Question;
var Player = require('./models/Player').Player;
var _ = require('underscore');
var q = require('q');

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
    gameSocket.on('playerIsReady', playerIsReadyEvent);
    gameSocket.on('refreshRoom', refreshRoom);
    gameSocket.on('answer', answerEvent);
    gameSocket.on('getQuestion', getQuestionEvent);
    gameSocket.on('allPlayersAreReady', allPlayersAreReady);
    gameSocket.on('getTableScore', getTableScore);
};

function createRoomEvent(data) {
    var sock = this;

    //mongodb questions dump
    //mongoQuestionsDump();

    new Player({
        _id: uuid.v1({nsecs: 961}),
        name: data.username,
        ready: false,
        isAdmin: true,
        socket: sock.id,
        score: 0,
        finish: false
    }).save(function (err, player) {
        validate(err, "Can't save player.");

        new Game({
            _id: uuid.v1({nsecs: 961}),
            players: [
                player._id
            ],
            questions: [],
            level: data.level ? data.level : 1
        }).save(function (err, game) {
                validate(err, "Can't save game.");

                // Join the Game and wait for the players
                sock.join(game._id);

                sock.emit('roomCreated', {
                    game: game._id,
                    you: player
                });
            }
        );
    });
}

function getPlayers(game) {
    var deferred = q.defer();

    Player.find({_id: {$in: game.players}}, function (err, players) {
        validate(err, "Can't find player.");
        if (err) deferred.reject(err);

        deferred.resolve(players);
    });

    return deferred.promise;
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
        }).save(function (err, nextPlayer) {
            validate(err, "Can't save player.");

            Game.findOneAndUpdate(
                {_id: data.game},
                {
                    $push: {players: nextPlayer._id}
                },
                {"new": true},
                function (err, game) {
                    validate(err, "Can't find game.");

                    // Join the game
                    sock.join(data.game);

                    gameIo.sockets.in(data.game).emit('playerJoined', {
                        game: game._id,
                        you: nextPlayer
                    });
                });
        });
    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error', {message: "This game does not exist."});
    }
}

function answerEvent(req) {
    pSocketsScoreMap[req.player.socket].inAction = false;

    Game.findOne({_id: req.game}, function (err, game) {
        validate(err, "Can't find game.");
        assertNotNull(game);

        var pScore = pSocketsScoreMap[req.player.socket].score;
        var isCorrect = false;

        Question.findOne({_id: req.q._id}, function (err, question) {
            validate(err, "Can't find question.");

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

            Player.update({_id: req.player._id}, updateDocument, function (err) {
                validate(err, "Can't find player.");

                Player.findOne({_id: req.player._id}, function (err, player) {

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
                });
            });
        });
    });
}

function getQuestionEvent(req) {
    Game.findOne({_id: req.game}, function (err, game) {
        validate(err, "Can't find game.");
        assertNotNull(game);

        var qId = null;

        if (req.qIndex < game.questions.length) {
            qId = game.questions[req.qIndex];
        } else {
            throw new Error("Wrong qIndex: " + req.qIndex);
        }

        //if it's a valid question index and there is next question
        if (qId != null) {
            Question.findOne({_id: qId}, function (err, question) {
                validate(err, "Can't find question.");

                var startScore = 60000;

                Player.findOne({_id: req.player._id}, function (err, player) {
                    validate(err, "Can't find player.");

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
                });
            })
        }
    })
}

function putScoreToMap(pSocket, score) {
    pSocketsScoreMap[pSocket] = {
        score: score,
        inAction: true
    }
}

function refreshRoom(req) {
    Game.findOne({_id: req.game}, function (err, game) {
        validate(err, "Can't find game.");

        getPlayers(game).then(function (players) {
            validate(err, "Can't find players.");

            gameIo.sockets.in(req.game).emit('updateRoom', {
                game: game._id,
                players: players
            });
        });
    });
}

function playerIsReadyEvent(data) {
    Game.findOne({_id: data.game}, function (err, game) {
        validate(err, "Can't find game.");

        if (_.contains(game.players, data.player._id)) {
            Player.findOneAndUpdate({_id: data.player._id}, {$set: {ready: true}}, function (err, player) {
                validate(err, "Can't find player.");

                getPlayers(game).then(function (players) {
                    gameIo.sockets.in(game._id).emit('updateRoom', {players: players});
                });
            });
        }
    })
}

function allPlayersAreReady(data) {
    //TODO: fix level
    loadQuestionsForGame(1).then(function (questions) {
        Game.findOneAndUpdate(
            {_id: data.game},
            {$set: {questions: get5RandomQuestionsIds(questions)}},
            function (err, game) {
                validate(err, "Can't find game.");

                startCountdown(game).then(function () {
                    gameIo.sockets.in(game._id).emit('startTheBattle');
                });
            }
        );
    });
}

function getTableScore(req) {
    var sock = this;

    Game.findOne({_id: req.game}, function (err, game) {
        validate(err, "Can't find game.");
        assertNotNull(game);

        Player.find({_id: {$in: game.players}, finish: true}, function (err, players) {
            validate(err, "Can't find players");

            //collect score table data
            var scoreTableData = _.map(players, function (player) {
                return {
                    name: player.name,
                    score: player.score
                }
            });

            //send new data
            sock.emit('refreshScoreTable', {
                players: scoreTableData
            })
        })
    });
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
    var deferred = q.defer();

    Question.find({level: level}, function (err, questions) {
        validate(err, "Can't find question.");

        deferred.resolve(questions);
    });

    return deferred.promise;
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

function mongoQuestionsDump() {
    new Question({
        _id: uuid.v1({nsecs: 961}),
        question: "What is JVM ?",
        possibleAnswers: [
            {
                index: 1,
                text: "A Java virtual machine (JVM) is a process virtual machine that can execute Java bytecode."
            },
            {index: 2, text: "Something else"},
            {index: 3, text: "Zalupa konskaya"},
            {index: 4, text: "STH"}
        ],
        isRadio: true,
        rightAnswers: [1],
        tags: ["general"],
        level: 1
    }).save();

    new Question({
        _id: uuid.v1({nsecs: 961}),
        question: "What are the Data Types supported by Java ?",
        possibleAnswers: [
            {index: 1, text: "byte, short, int, long"},
            {index: 2, text: "double, float, boolean"},
            {index: 3, text: "integer, var, val"},
            {index: 4, text: "byte, short, char, int, long, float, double, boolean"}
        ],
        isRadio: true,
        rightAnswers: [4],
        tags: ["general"],
        level: 1
    }).save();

    new Question({
        _id: uuid.v1({nsecs: 961}),
        question: "What are the basic interface of Java Collections Framework ?",
        possibleAnswers: [
            {index: 1, text: "HashMap"},
            {index: 2, text: "Collection"},
            {index: 3, text: "ArrayList"},
            {index: 4, text: "Array"}
        ],
        isRadio: true,
        rightAnswers: [2],
        tags: ["general"],
        level: 1
    }).save();
}

function validate(err, message) {
    if (err) {
        throw new Error(message.concat("Cause: " + err));
    }
}

function assertNotNull(obj) {
    if (obj == null) {
        throw new Error("Object " + obj + " can't be null!");
    }
}