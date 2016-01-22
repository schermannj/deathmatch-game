var uuid = require('uuid');
var Game = require('./models/Game').Game;

var gameIo;
var gameSocket;

module.exports = function (io, socket) {
    gameIo = io;
    gameSocket = socket;

    gameSocket.emit('connected', {message: "You are connected!"});

    //events
    gameSocket.on('createRoom', createRoomEvent);
    gameSocket.on('joinRoom', joinRoomEvent);
};

function createRoomEvent(data) {
    var sock = this;

    new Game({
        _id: uuid.v1({nsecs: 961}),
        players: {
            first: data.username
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
        // attach the socket id to the data object.
        //data.socketId = sock.id;

        // Join the game
        sock.join(data.game);

        Game.findOneAndUpdate(
            {_id: data.game, "players.second": {$exists: false}},
            {$set: {"players.second": data.username}},
            {"new": true},
            function (err, updatedGame) {
                if (err) {
                    throw new Error("Can't find game");
                }

                delete data.username;
                data.firstPlayer = updatedGame.players.first;
                data.secondPlayer = updatedGame.players.second;

                // Emit an event notifying the clients that the player has joined the game.
                gameIo.sockets.in(data.game).emit('playerJoinedRoom', data);

            });
    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error', {message: "This game does not exist."});
    }
}