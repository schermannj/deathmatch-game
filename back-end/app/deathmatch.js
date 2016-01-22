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
    // Create a unique Socket.IO Room
    var roomId = (( Math.random() * 100000 ) | 0).toString();

    new Game({
        roomId: roomId,
        players: {
            first: data.username
        },
        questions: [],
        level: data.level ? data.level : 1.
    }).save(function (err, game) {
            // Join the Room and wait for the players
            this.join(roomId);

            // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
            this.emit('roomCreated', {roomId: roomId, socketId: this.id, game: game._id});
        }
    );
}

function joinRoomEvent(data) {
    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    var room = gameSocket.adapter.rooms[data.roomId];

    // If the room exists...
    if (room) {
        // attach the socket id to the data object.
        data.socketId = sock.id;

        // Join the room
        sock.join(data.roomId);

        Room.findOne({roomId: data.roomId}, function (err, room, next) {
            if (err) {
                next(err);
            }

            var secondPlayer = new Player({name: data.username});
            secondPlayer.save();

            room.secondPlayer = secondPlayer;
            room.save();

            data.firstPlayer = room.firstPlayer;
            data.secondPlayer = room.secondPlayer;

            // Emit an event notifying the clients that the player has joined the room.
            gameIo.sockets.in(data.roomId).emit('playerJoinedRoom', data);

        });

        //TODO: here I should get first user from mongo and send it to second user; So next step is to design models and use mongo;


    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error', {message: "This room does not exist."});
    }
}