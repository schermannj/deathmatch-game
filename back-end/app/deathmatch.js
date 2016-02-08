var uuid = require('uuid');
var Game = require('./models/Game').Game;
var Question = require('./models/Question').Question;
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
    gameSocket.on('playerIsReady', playerIsReady);
    gameSocket.on('answer', doAnswer);
    gameSocket.on('getQuestion', getQuestion);
};

function createRoomEvent(data) {
    var sock = this;

    //mongodb questions dump
    //mongoQuestionsDump();

    new Game({
        _id: uuid.v1({nsecs: 961}),
        players: {
            first: {
                name: data.username,
                ready: false,
                socket: sock.id
            }
        },
        questions: [],
        level: data.level ? data.level : 1.
    }).save(function (err, game) {
            // Join the Game and wait for the players
            sock.join(game._id);
            // Return the Game ID (gameId)
            sock.emit('roomCreated', {socketId: this.id, game: game._id});
        }
    );
}

function joinRoomEvent(data) {
    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the game ID in the Socket.IO manager object.
    var game = gameSocket.adapter.rooms[data.game];

    // If the game exists...
    if (game) {
        //TODO: add functional if I want to play alone
        Game.findOneAndUpdate(
            {_id: data.game, "players.second": {$exists: false}},
            {
                $set: {
                    "players.second.name": data.username,
                    "players.second.ready": false,
                    "players.second.socket": sock.id
                }
            },
            {"new": true},
            function (err, updatedGame) {
                if (err) {
                    throw new Error("Can't find game");
                }

                delete data.username;
                data.firstPlayer = updatedGame.players.first;
                data.secondPlayer = updatedGame.players.second;

                // Join the game
                sock.join(data.game);

                // Emit an event notifying the clients that the player has joined the game.
                gameIo.sockets.in(data.game).emit('playerJoinedRoom', data);
            });
    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error', {message: "This game does not exist."});
    }
}

function doAnswer(req) {
    pSocketsScoreMap[req.pSocket].inAction = false;

    var pScore = pSocketsScoreMap[req.pSocket].score;
    var isCorrect = false;

    Question.findOne({_id: req.qId}, function (err, question) {
        if (err) {
            throw new Error("Can't find question. Cause: " + err);
        }

        if (question.rightAnswer == req.answer) {
            isCorrect = true;
        } else {
            pScore = 0;
        }

        Game.findOne({_id: req.game}, function (err, game) {
            if (err) {
                throw new Error("Can't find game. Cause: " + err);
            }

            //TODO: determine which of players score should be updated

        });

        gameIo.sockets.in(req.game).sockets[req.pSocket].emit('answerAccepted', {
            score: pScore,
            isCorrect: isCorrect
        });

        //TODO: save score progress to mongo
        //TODO: and then set to zero  pSocketsScoreMap[req.pSocket].score
    });
}

function getQuestion(req) {
    Game.findOne({_id: req.game}, function (err, game) {
        if (err) {
            throw new Error("Can't find game");
        }

        if (game != null && req.qIndex < game.questions.length) {
            var qId = game.questions[req.qIndex];
        } else {
            throw new Error("Wrong qIndex: " + req.qIndex);
        }

        Question.findOne({_id: qId}, function (err, question) {
            if (err) {
                throw new Error("Can't find question");
            }

            var startScore = 60000;

            gameIo.sockets.in(game._id).sockets[req.pSocket].emit('receiveQuestion', {
                _id: question._id,
                question: question.question,
                possibleAnswers: question.possibleAnswers,
                score: startScore
            });

            putScoreToMap(req.pSocket, startScore);
            startScoreCountdown(game._id, req.pSocket, startScore);
        })
    })
}

function putScoreToMap(pSocket, score) {
    pSocketsScoreMap[pSocket] = {
        score: score,
        inAction: true
    }
}

function playerIsReady(data) {
    Game.findOne({_id: data.game}, function (err, game) {
        if (err) {
            throw new Error("Can't find game");
        }

        var firstP = game.players.first;
        var secondP = game.players.second;

        if (firstP.name == data.player) {
            preparePlayersForTheBattle(firstP, secondP, game);
        } else if (secondP.name == data.player) {
            preparePlayersForTheBattle(secondP, firstP, game);
        } else {
            throw new Error("Player not found!")
        }
    })
}

function preparePlayersForTheBattle(you, opponent, game) {
    if (opponent.ready) {
        updateReadyPlayerCondition(game, you.name, function () {

            loadQuestionsForGame(game.level).then(function (questions) {
                Game.findOneAndUpdate(
                    {_id: game._id},
                    {$set: {questions: get5RandomQuestionsIds(questions)}},
                    function (err, game) {
                        if (err != null) {
                            throw new Error("Can't start game. Cause: " + err);
                        }

                        startCountdown(game).then(function () {
                            gameIo.sockets.in(game._id).emit('startTheBattle');
                        });
                    }
                );
            });
        });
    } else {
        updateReadyPlayerCondition(game, you.name, function () {
            gameIo.sockets.in(game._id).sockets[opponent.socket].emit('opponentIsReady');
        });
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
        } else {
            pSocketsScoreMap[pSocket].score = score;
        }
    }, 100);
}

function updateReadyPlayerCondition(game, playerName, callback) {
    Game.update({_id: game._id}, {$set: getReadyPlayerCondition(playerName, game.players)}, callback)
}

function getReadyPlayerCondition(readyPlayer, players) {
    if (players.first.name == readyPlayer) {
        return {"players.first.ready": true}
    } else if (players.second.name == readyPlayer) {
        return {"players.second.ready": true}
    }
}

function loadQuestionsForGame(level) {
    var deferred = q.defer();

    Question.find({level: level}, function (err, questions) {
        if (err) {
            throw new Error("Can't find questions. Cause: " + err);
        }

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
            {1: "A Java virtual machine (JVM) is a process virtual machine that can execute Java bytecode."},
            {2: "Something else"},
            {3: "Zalupa konskaya"},
            {4: "STH"}
        ],
        rightAnswer: 1,
        tags: ["general"],
        level: 1
    }).save();

    new Question({
        _id: uuid.v1({nsecs: 961}),
        question: "What are the Data Types supported by Java ?",
        possibleAnswers: [
            {1: "byte, short, int, long"},
            {2: "double, float, boolean"},
            {3: "integer, var, val"},
            {4: "byte, short, char, int, long, float, double, boolean"}
        ],
        rightAnswer: 4,
        tags: ["general"],
        level: 1
    }).save();

    new Question({
        _id: uuid.v1({nsecs: 961}),
        question: "What are the basic interface of Java Collections Framework ?",
        possibleAnswers: [
            {1: "HashMap"},
            {2: "Collection"},
            {3: "ArrayList"},
            {4: "Array"}
        ],
        rightAnswer: 2,
        tags: ["general"],
        level: 1
    }).save();
}