import * as _ from 'lodash';
import Game from '../models/Game';
import Question from '../models/Question';
import Player from '../models/Player';
import ExceptionHandlerService from '../services/exception-handler.service';
import {STATE} from "../config/constants";
import * as log4js from 'log4js';

const PLAYER_START_SCORE = 60000;
const SCORE_MIN_DEGREE = 100;
const SCORE_COUNTDOWN_DELAY = 100;
const pSocketsScoreMap = {};

let self;
export default class QuestionEventHandler {

    constructor(gameIo, gameSocket, ehs) {
        self = this;

        self.log = log4js.getLogger();
        self.gameIo = gameIo;
        self.ehs = ehs;

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

        // find game object
        Game.findOne({_id: data.game})
            .then((game) => {
                ExceptionHandlerService.assertNotNull(game);

                // check if question index < game questions count
                if (data.qIndex >= game.questions.length) {
                    self.log.debug(`Invalid question index - ${data.qIndex}`);

                    sock.emit('serverError', {message: `Something went wrong - invalid question index. Seems 
                                                    like you're going to lose this game...`});
                    return;
                }

                // get next question and player
                return Promise.all([
                    Question.findOne({_id: game.questions[data.qIndex]}),
                    Player.findOne({_id: data.player._id})
                ]);

            }, ExceptionHandlerService.validate)
            .then((resolveArray) => {

                // check resolve array (length has to be 2 - question and player)
                if(resolveArray.length != 2) {
                    self.log.debug(`Invalid resolve array length - ${resolveArray.length}`);

                    sock.emit('serverError', {message: `Something went wrong - invalid resolve array length.`});

                    return;
                }

                // get player and question from the response
                let question = resolveArray[0];
                let player = resolveArray[1];

                // emit question object and player scores to the player
                sock.emit('receiveQuestion', {
                    question: {
                        id: question._id,
                        text: question.question,
                        possibleAnswers: question.possibleAnswers,
                        isRadio: question.isRadio
                    },
                    qScore: PLAYER_START_SCORE,
                    totalScore: player.score
                });

                // store player score to the map
                self.putScoreToMap(player.socket, PLAYER_START_SCORE);

                // start new countdown for the new question
                self.startScoreCountdown(sock, PLAYER_START_SCORE);

            }, ExceptionHandlerService.validate)
            .catch((err) => {
                ExceptionHandlerService.emitError(sock, err);
            });
    }

    /**
     * @this is a socket obj;
     */
    answerQuestionEvent(data) {
        let sock = this;

        if (!self.ehs.validateGameExistence(data.game, sock)) {
            return;
        }

        // set up player state to 'false' (it means that player is waiting for result and new question)
        pSocketsScoreMap[sock.id].inAction = false;

        let isCorrect = false;
        let hasMoreQuestions = true;

        Promise.all([Game.findOne({_id: data.game}), Question.findOne({_id: data.q._id})])
            .then((resolveArray) => {

                // check resolve array (length has to be 2 - game and question)
                if(resolveArray.length != 2) {
                    self.log.debug(`Invalid resolve array length - ${resolveArray.length}`);

                    sock.emit('serverError', {message: `Something went wrong - invalid resolve array length.`});

                    return;
                }

                // define game and question variables
                let game = resolveArray[0];
                let question = resolveArray[1];

                ExceptionHandlerService.assertNotNull(game);

                // get player score for this question
                let pScore = pSocketsScoreMap[sock.id].score;

                // check if right answers contain player answer
                let answersIntersection = _.intersection(question.rightAnswers, data.q.answer);

                // if right answers contain player answer then player answer is correct, in other case player score = 0
                if (question.rightAnswers.length == answersIntersection.length) {
                    isCorrect = true;
                } else {
                    pScore = 0;
                }

                // check if it isn't the last question
                hasMoreQuestions = data.q.index != game.questions.length;
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
                pSocketsScoreMap[sock.id].score = 0;

                if (hasMoreQuestions) {
                    //there are more questions
                    sock.emit('answerAccepted', {
                        totalScore: player.score,
                        isCorrect: isCorrect
                    });
                } else {
                    //that was the the last question
                    sock.emit('gameOver', {
                        player: player,
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

    startScoreCountdown(pSocket, score) {
        let countdown = () => {
            // decrement score
            score = score - SCORE_MIN_DEGREE;

            // emit to player his current score value
            pSocket.emit('scoreCountdown', {
                score: score
            });

            // if score > 0 and player still didn't answer a question - continue score countdown
            if (score > 0 && pSocketsScoreMap[pSocket.id].inAction) {
                setTimeout(countdown, SCORE_COUNTDOWN_DELAY);
            }

            // save player's score state to the map;
            self.putScoreToMap(pSocket.id, score);
        };

        setTimeout(countdown, SCORE_COUNTDOWN_DELAY);
    }

    putScoreToMap(pSocket, score) {
        pSocketsScoreMap[pSocket] = {
            score: score,
            inAction: true
        }
    }
}
