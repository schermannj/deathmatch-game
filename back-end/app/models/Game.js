import uuid from 'uuid';
import mongoose from '../components/mongoose';

const Schema = mongoose.Schema;

const GameSchema = new Schema({
    _id: {
        type: String,
        required: true,
        default: uuid.v1({nsecs: 961})
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
