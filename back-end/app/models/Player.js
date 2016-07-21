import mongoose from '../components/mongoose';

const Schema = mongoose.Schema;

const PlayerSchema = new Schema({
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
    },
    finish: {
        type: Boolean
    }
});

export default mongoose.model('Player', PlayerSchema);

