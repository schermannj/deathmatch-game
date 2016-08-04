import * as _ from "lodash";
import Game from "../models/Game";
import Question from "../models/Question";
import Player from "../models/Player";
import ExceptionHandlerService from "../services/exception-handler.service";
import {STATE, SCORE_MIN_DEGREE, SCORE_COUNTDOWN_DELAY} from "../config/constants";
import * as log4js from "log4js";

let self;
export default class QuestionEventHandler {

    constructor(gameIo, gameSocket, ehs, psh) {
        self = this;

        self.log = log4js.getLogger();
        self.gameIo = gameIo;
        self.ehs = ehs;
        self.psh = psh;

        gameSocket.on('getQuestion', this.getQuestionEvent);
        gameSocket.on('answer', this.answerQuestionEvent);
    }

    /**
     * @this is a socket obj;
     */
    getQuestionEvent(data) {
        let sock = this;

        if (!self.ehs.validateGameExistence(data.game, sock)) {
            return;
        }

        // find player object to next question id
        Player
            .findOne({_id: data.player, game: data.game})
            .then((player) => {
                // find next question and send player to next promise chain
                return Promise.all([Question.findOne({_id: player.currentQuestion.id}), Promise.resolve(player)]);

            }, ExceptionHandlerService.validate)
            .then((resp) => {
                // check resolve array (length has to be 2 - question and player)
                if (resp.length != 2) {
                    throw new Error(`Invalid resolve array length - ${resp.length}`);
                }

                // get player and question from the response
                let question = resp[0];
                let player = resp[1];

                // emit question object and player scores to the player
                sock.emit('receiveQuestion', {
                    question: {
                        id: question._id,
                        text: question.question,
                        possibleAnswers: question.possibleAnswers,
                        isRadio: question.isRadio
                    },
                    qScore: player.currentQuestion.score,
                    totalScore: player.score
                });

                // store player score to the map
                self.psh.put(player.socket, player.currentQuestion.score);

                // start new countdown for the new question
                self.startScoreCountdown(sock, player._id);

            }, ExceptionHandlerService.validate)
            .catch((err) => {
                ExceptionHandlerService.emitError(sock, err);
            });
    }

    /**
     * @this is a socket obj; TODO: rewrite it
     */
    answerQuestionEvent(data) {
        let sock = this;

        if (!self.ehs.validateGameExistence(data.game, sock)) {
            return;
        }

        // if (player.questions.length === 0) {
        //     throw new Error('Something went wrong, no more question exists')
        // }

        // get next question
        // let currentQuestionId = player.questions.shift();
        //
        // Player.findOneAndUpdate(
        //     {_id: player._id, game: player.game},
        //     {
        //         $set: {
        //             questions: player.questions,
        //             lastQuestionState: {id: currentQuestionId, score: PLAYER_START_SCORE}
        //         }
        //     },
        //     {new: true}
        // )

        // set up player state to 'false' (it means that player is waiting for result and new question)
        self.psh.setInAction(sock.id, false);

        let isCorrect = false;
        let hasMoreQuestions = true;

        Promise.all([Game.findOne({_id: data.game}), Question.findOne({_id: data.question._id})])
            .then((resolveArray) => {

                // check resolve array (length has to be 2 - game and question)
                if (resolveArray.length != 2) {
                    self.log.debug(`Invalid resolve array length - ${resolveArray.length}`);

                    sock.emit('serverError', {message: `Something went wrong - invalid resolve array length.`});

                    return;
                }

                // define game and question variables
                let game = resolveArray[0];
                let question = resolveArray[1];

                ExceptionHandlerService.assertNotNull(game);

                // get player score for this question
                let pScore = self.psh.getScore(sock.id);

                // check if right answers contain player answer
                let answersIntersection = _.intersection(question.rightAnswers, data.question.answer);

                // if right answers contain player answer then player answer is correct, in other case player score = 0
                if (question.rightAnswers.length == answersIntersection.length && question.rightAnswers.length == data.question.answer.length) {
                    isCorrect = true;
                } else {
                    pScore = 0;
                }

                // check if it isn't the last question
                hasMoreQuestions = data.question.index != game.questions.length;
                let updateDocument = {$inc: {score: pScore}};

                // if there isn't more questions player finish state will be set to 'true'
                if (!hasMoreQuestions) {
                    updateDocument['$set'] = {state: STATE.FINISHED};
                }

                // update player info and return updated document
                return Player.findOneAndUpdate({_id: data.player._id, game: data.game}, updateDocument, {new: true});

            }, ExceptionHandlerService.validate)
            .then((player) => {
                // set current player score to 0, in the 'getQuestionEvent' it will be updated
                self.psh.setScore(sock.id, 0);

                if (hasMoreQuestions) {
                    //there are more questions
                    sock.emit('answerAccepted', {
                        totalScore: player.score,
                        isCorrect: isCorrect
                    });
                } else {
                    //that was the the last question
                    sock.emit('gameOver', {
                        score: player.score,
                        game: data.game
                    });

                    // emit an event and update score table data for other users from this game
                    self.gameIo.sockets.in(data.game).emit('doRefreshCycle');
                }
            }, ExceptionHandlerService.validate)
            .catch((err) => {
                ExceptionHandlerService.emitError(sock, err);
            });
    }

    startScoreCountdown(pSocket, playerId) {
        let countdown = () => {
            // decrement score
            let score = self.psh.getScore(pSocket.id) - SCORE_MIN_DEGREE;

            // emit to player his current score value
            pSocket.emit('scoreCountdown', {
                score: score
            });

            // if score > 0 and player still didn't answer a question - continue score countdown
            if (score > 0 && self.psh.getInAction(pSocket.id)) {
                setTimeout(countdown, SCORE_COUNTDOWN_DELAY);
            }

            // save player's score state to the map;
            self.psh.put(pSocket.id, score);

            // TODO: it's a hack, need to find better way :/
            if (score === 0) {
                Player.findOneAndUpdate({_id: playerId}, {$set: {"currentQuestion.score": 0}}, {new: true})
                    .then((player) => {
                        console.log(player.currentQuestion);
                    });
            }
        };

        setTimeout(countdown, SCORE_COUNTDOWN_DELAY);
    }
}
