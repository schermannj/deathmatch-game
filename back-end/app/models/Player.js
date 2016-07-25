import mongoose from '../components/mongoose';

const Schema = mongoose.Schema;

const PlayerSchema = new Schema({
    _id: {
        type: String,
        required: true
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

