import mongoose from '../components/mongoose';

const Schema = mongoose.Schema;

const GameSchema = new Schema({
    _id: {
        type: String,
        required: true
    },

    /** @Deprecated */
    players: {
        type: [String]
    },

    questions: {
        type: [String]
    },
    level: {
        type: Number
    },
    created: {
        type: Date,
        default: Date.now()
    }
});

export default mongoose.model('Game', GameSchema);
