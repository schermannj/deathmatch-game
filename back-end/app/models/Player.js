var mongoose = require('../components/mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
    _id: {
        type: String,
        required: true
    },
    isAdmin : {
        type: Boolean
    },
    name: {
        type: String,
        required: true
    },
    ready: {
        type: Boolean
    },
    socket: {
        type: String,
        required: true
    },
    score: {
        type: Number
    }
});

exports.Player = mongoose.model('Player', schema);
