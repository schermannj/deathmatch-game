import mongoose from '../components/mongoose';

const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
    _id: {
        type: String,
        required: true
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
