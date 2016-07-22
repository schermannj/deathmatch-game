import uuid from 'uuid';
import mongoose from '../components/mongoose';

const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
    _id: {
        type: String,
        required: true,
        default: uuid.v1({nsecs: 961})
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
