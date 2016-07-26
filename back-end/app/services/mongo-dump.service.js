import Question from "../models/Question";

export default class MongoDumpService {

    static doQuestionDump() {
        new Question({
            question: "What is JVM ?",
            possibleAnswers: [
                {
                    index: 1,
                    text: "A Java virtual machine (JVM) is a process virtual machine that can execute Java bytecode."
                },
                {index: 2, text: "Something else"},
                {index: 3, text: "Zalupa konskaya"},
                {index: 4, text: "STH"}
            ],
            isRadio: true,
            rightAnswers: [1],
            tags: ["general"],
            level: 1
        }).save();

        new Question({
            question: "What are the Data Types supported by Java ?",
            possibleAnswers: [
                {index: 1, text: "byte, short, int, long"},
                {index: 2, text: "double, float, boolean"},
                {index: 3, text: "integer, var, val"},
                {index: 4, text: "byte, short, char, int, long, float, double, boolean"}
            ],
            isRadio: true,
            rightAnswers: [4],
            tags: ["general"],
            level: 1
        }).save();

        new Question({
            question: "What are the basic interface of Java Collections Framework ?",
            possibleAnswers: [
                {index: 1, text: "HashMap"},
                {index: 2, text: "Collection"},
                {index: 3, text: "ArrayList"},
                {index: 4, text: "Array"}
            ],
            isRadio: true,
            rightAnswers: [2],
            tags: ["general"],
            level: 1
        }).save();

        new Question({
            question: "Lesik dalbaeb?",
            possibleAnswers: [
                {index: 1, text: "da"},
                {index: 2, text: "da"},
                {index: 3, text: "da"},
                {index: 4, text: "net"}
            ],
            isRadio: true,
            rightAnswers: [1,2,3],
            tags: ["general"],
            level: 1
        }).save();

    }
}
