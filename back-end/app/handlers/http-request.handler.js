import Player from '../models/Player';
import * as log4js from 'log4js';

export default class HttpRequestHandler {

    constructor(app) {
        this.log = log4js.getLogger();

        app.get('/player/:id', this.getPlayer.bind(this));
    }

    getPlayer(req, resp) {
        this.log.debug(req.params.id);

        Player.findOne({_id: req.params.id})
            .then((player) => {
                resp.send(player);
            });
    }
}