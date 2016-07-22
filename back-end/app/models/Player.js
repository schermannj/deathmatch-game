import uuid from 'uuid';
import mongoose from '../components/mongoose';

const Schema = mongoose.Schema;

const PlayerSchema = new Schema({
    _id: {
        type: String,
        required: true,
        default: uuid.v1({nsecs: 961})
    },
    isAdmin : {
        type: Boolean,
        default: false
    },
    game: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    ready: {
        type: Boolean,
        default: false
    },
    socket: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        default: 10
    },
    finish: {
        type: Boolean,
        default: false
    },
    disconnected: {
        type: Boolean,
        default: false
    }
});

export default mongoose.model('Player', PlayerSchema);

