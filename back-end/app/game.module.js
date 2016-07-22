import MongoDumpService from "./services/mongo-dump.service";
import GameEventHandler from "./handlers/game-event.handler";

const DO_MONGO_DUMP = false;

export default class GameModule {

    constructor(io, socket) {
        if (DO_MONGO_DUMP) {
            MongoDumpService.doQuestionDump();
        }

        new GameEventHandler(io, socket);

        socket.emit('connected', {message: "You are connected!"});
    }
}
