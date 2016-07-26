import mongoose from '../components/mongoose';
import {ID_MIXIN} from "../config/constants";
import uuid from 'uuid';

const Schema = mongoose.Schema;

const GameSchema = new Schema({
    _id: {
        type: String,
        required: true,
        default: () => {
            return uuid.v1({nsecs: ID_MIXIN});
        }
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
    },
    available: {
        type: Boolean,
        default: true
    }
});

export default mongoose.model('Game', GameSchema);
