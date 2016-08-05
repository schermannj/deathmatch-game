//noinspection JSFileReferences
import EVENTS from 'shared-util/event.constants.js';
import * as log4js from 'log4js';

export default class ExceptionHandlerService {

    constructor(gameSocket) {
        this.log = log4js.getLogger();
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
        sock.emit(EVENTS.FE.SERVER_ERROR, {message: err.message});
    }

    doesGameExist(game) {
        // Look up the game ID in the Socket.IO manager object.
        return this.gameSocket.adapter.rooms[game];
    }

    validateGameExistence(game, sock) {
        if (!this.doesGameExist(game)) {
            sock.emit(EVENTS.FE.SERVER_ERROR, {message: "This game does not exist."});

            return false;
        }

        return true;
    }
}