import PlayerEventHandler from "./player-event.handler";
import RoomEventHandler from "./room-event.handler";
import QuestionEventHandler from "./question-event.handler";
import ExceptionHandlerService from "../services/exception-handler.service";
import PlayerScoreHolder from "../services/player-score.holder";

export default class GameEventHandler {

    constructor(io) {
        this.psh = new PlayerScoreHolder();
        this.io = io;

        this.subscribe();
    }

    subscribe() {
        let self = this;

        self.io.sockets.on('connection', (socket) => {
            let ehs = new ExceptionHandlerService(socket);

            new RoomEventHandler(self.io, socket, ehs);
            new PlayerEventHandler(self.io, socket, ehs, self.psh);
            new QuestionEventHandler(self.io, socket, ehs, self.psh);
        });
    }
}