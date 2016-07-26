import mongoose from '../components/mongoose';
import {ID_MIXIN} from "../config/constants";
import uuid from 'uuid';

const Schema = mongoose.Schema;

const PlayerSchema = new Schema({
    _id: {
        type: String,
        required: true,
        default: () => {
            return uuid.v1({nsecs: ID_MIXIN});
        }
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
    socket: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        default: 0
    },
    state: {
        type: String
    }
});

export default mongoose.model('Player', PlayerSchema);

