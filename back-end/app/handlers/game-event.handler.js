import PlayerEventHandler from './player-event.handler';
import RoomEventHandler from './room-event.handler';
import QuestionEventHandler from './question-event.handler';
import ExceptionHandlerService from "../services/exception-handler.service";

export default class GameEventHandler {

    constructor(io, socket) {
        let ehs = new ExceptionHandlerService(socket);

        new RoomEventHandler(io, socket, ehs);
        new PlayerEventHandler(io, socket, ehs);
        new QuestionEventHandler(io, socket, ehs);
    }
}