var uuid = require('uuid');
var mongoose = require('../components/mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
    _id: {
        type: String,
        required: true,
        default: uuid.v1()
    },
    players: {
        type: Schema.Types.Mixed
    },
    questions: {
        type: [Number],
        required: false //TODO: change on true
    },
    level: {
        type: Number
    },
    winner: {
        type: Schema.Types.Mixed
    },
    created: {
        type: Date,
        default: Date.now()
    }
});

exports.Game = mongoose.model('Game', schema);
