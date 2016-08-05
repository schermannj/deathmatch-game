//noinspection JSFileReferences
import EVENTS from 'shared-util/event.constants.js';
import PlayerEventHandler from './player-event.handler';
import RoomEventHandler from './room-event.handler';
import QuestionEventHandler from './question-event.handler';
import ExceptionHandlerService from '../services/exception-handler.service';
import PlayerScoreHolder from '../services/player-score.holder';
import * as log4js from 'log4js';

export default class GameEventHandler {

    constructor(io) {
        this.psh = new PlayerScoreHolder();
        this.io = io;
        this.log = log4js.getLogger();

        this.subscribe();
    }

    subscribe() {
        let self = this;

        self.io.sockets.on(EVENTS.BE.CONNECTION, (socket) => {
            let ehs = new ExceptionHandlerService(socket);

            self.log.debug(`GameEventHandler: connected. Socket - ${socket.id}`);

            new RoomEventHandler(self.io, socket, ehs);
            new PlayerEventHandler(self.io, socket, ehs, self.psh);
            new QuestionEventHandler(self.io, socket, ehs, self.psh);
        });
    }
}