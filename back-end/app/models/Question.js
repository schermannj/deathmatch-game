var mongoose = require('../components/mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
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

exports.Question = mongoose.model('Question', schema);
