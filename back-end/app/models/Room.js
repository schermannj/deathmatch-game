var mongoose = require('../components/mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
    roomId: {
        type: Number,
        required: true
    },
    firstPlayer: {
        type: Schema.Types.Mixed
    },
    secondPlayer: {
        type: Schema.Types.Mixed
    },
    created: {
        type: Date,
        default: Date.now()
    }
});

exports.Room = mongoose.model('Room', schema);
