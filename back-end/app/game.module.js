import MongoDumpService from "./services/mongo-dump.service";
import GameEventHandler from "./handlers/game-event.handler";
import {DO_MONGO_DUMP} from './config/constants';

export default class GameModule {

    constructor(io) {
        if (DO_MONGO_DUMP) {
            MongoDumpService.doQuestionDump();
        }

        new GameEventHandler(io);
    }
}
