import {Injectable} from "@angular/core";
import {WS_SERVER_URL} from "../util/config.util";
import * as ioInstance from 'socket.io-client';

@Injectable()
export class SocketService {
    private _io: any;

    public connect() {
        return this.getInstance();
    }

    public hasConnection() {
        return this._io !== undefined;
    }

    public io() {
        if (!this._io) {
            throw new Error('Socket isn\'t connected. You should create socket instance before use.');
        }

        return this._io;
    }

    private getInstance() {
        this._io = ioInstance(WS_SERVER_URL, {
            reconnection: true,
            reconnectionDelay: 500,
            reconnectionAttempts: 3
        });

        return this._io;
    }
}