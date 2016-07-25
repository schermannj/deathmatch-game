export default class ExceptionHandlerService {

    constructor(gameSocket) {
        this.gameSocket = gameSocket;
    }

    static validate(err) {
        if (err) {
            throw new Error("Cause: " + err);
        }
    }

    static assertNotNull(obj) {
        if (!obj) {
            throw new Error("Object " + obj + " can't be null!");
        }
    }

    static emitError(sock, err) {
        sock.emit('error', {message: err.message});
    }

    doesGameExist(game) {
        // Look up the game ID in the Socket.IO manager object.
        return this.gameSocket.adapter.rooms[game];
    }

    validateGameExistence(game, sock) {
        if (!this.doesGameExist(game)) {
            console.debug(game, sock);
            sock.emit('error', {message: "This game does not exist anymore."});

            return false;
        }

        return true;
    }
}