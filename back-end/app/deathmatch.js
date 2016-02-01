var uuid = require('uuid');
var Game = require('./models/Game').Game;
var _ = require('underscore');

var gameIo;
var gameSocket;

module.exports = function (io, socket) {
    gameIo = io;
    gameSocket = socket;

    gameSocket.emit('connected', {message: "You are connected!"});

    //events
    gameSocket.on('createRoom', createRoomEvent);
    gameSocket.on('joinRoom', joinRoomEvent);
    gameSocket.on('playerIsReady', playerIsReady);
};

function createRoomEvent(data) {
    var sock = this;

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
                data.firstPlayer = updatedGame.players.first.name;
                data.secondPlayer = updatedGame.players.second.name;

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

            //TODO: fix this shit!
            for (var count = 3; count <= 0; count--) {
                setInterval(function () {
                    gameIo.sockets.in(game._id).emit('startCountdown', {counter: count});
                }, 1000);
            }

            gameIo.sockets.in(game._id).emit('startTheBattle', {
                gameStarted: true
            });
        });
    } else {
        updateReadyPlayerCondition(game, you.name, function () {
            gameIo.sockets.in(game._id).sockets[opponent.socket].emit('opponentIsReady');
        });
    }
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