import PlayerEventHandler from './player-event.handler';
import RoomEventHandler from './room-event.handler';
import QuestionEventHandler from './question-event.handler';
import ExceptionHandlerService from "../services/exception-handler.service";
import PlayerScoreHolder from "../services/player-score.holder";

// TODO: fix that
const psh = new PlayerScoreHolder();
export default class GameEventHandler {

    constructor(io, socket) {
        let ehs = new ExceptionHandlerService(socket);

        new RoomEventHandler(io, socket, ehs);
        new PlayerEventHandler(io, socket, ehs, psh);
        new QuestionEventHandler(io, socket, ehs, psh);
    }
}