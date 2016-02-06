var mongoose = require('../components/mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
    _id: {
        type: String,
        required: true
    },
    players: {
        type: Schema.Types.Mixed
    },
    questions: {
        type: [Schema.Types.Mixed]
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
