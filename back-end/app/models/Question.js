import mongoose from '../components/mongoose';
import {ID_MIXIN} from "../config/constants";
import uuid from 'uuid';

const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
    _id: {
        type: String,
        required: true,
        default: () => {
            return uuid.v1({nsecs: ID_MIXIN});
        }
    },
    question: {
        type: String,
        required: true
    },
    possibleAnswers: {
        type: [Schema.Types.Mixed],
        required: true
    },
    rightAnswers: {
        type: [Number]
    },
    isRadio: {
        type: Boolean,
        required: true
    },
    tags: {
        type: [String]
    },
    level: {
        type: Number
    }
});

export default mongoose.model('Question', QuestionSchema);
