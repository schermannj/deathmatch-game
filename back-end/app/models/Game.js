var mongoose = require('../components/mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
    _id: {
        type: String,
        required: true
    },
    players: {
        type: [String]
    },
    questions: {
        type: [String]
    },
    level: {
        type: Number
    },
    winner: {
        type: String
    },
    created: {
        type: Date,
        default: Date.now()
    }
});

exports.Game = mongoose.model('Game', schema);
