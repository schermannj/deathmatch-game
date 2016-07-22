import * as _ from 'lodash';
import Game from '../models/Game';
import Question from '../models/Question';
import Player from '../models/Player';
import ExceptionHandlerService from '../services/exception-handler.service';

const COUNTDOWN_COUNT = 3;
const COUNTDOWN_DELAY = 1000;

let self;
export default class PlayerEventHandler {

    constructor(gameIo, gameSocket, ehs) {
        self = this;

        self.gameIo = gameIo;
        self.ehs = ehs;

        gameSocket.on('playerIsReady', this.playerIsReadyEvent);
        gameSocket.on('allPlayersAreReady', this.allPlayersAreReadyEvent);
    }

    /**
     * @this is a socket obj;
     */
    playerIsReadyEvent(data) {
        if (!self.ehs.validateGameExistence(data.game, this)) {
            return;
        }

        // find player with specific id and game and update his ready status
        Player.findOneAndUpdate({_id: data.player._id, game: data.game}, {$set: {ready: true}})
            .then(() => {

                // find all players from that game
                return Player.find({game: data.game});

            }, ExceptionHandlerService.validate)
            .then((players) => {

                // send updated status to all players from the game
                self.gameIo.sockets.in(data.game).emit('updateRoom', {players: players});

            }, ExceptionHandlerService.validate);
    }

    /**
     * @this is a socket obj;
     */
    allPlayersAreReadyEvent(data) {
        if (!self.ehs.validateGameExistence(data.game, this)) {
            return;
        }

        //TODO: implement ability to choose questions level
        // find all questions for a specific level
        Question.find({level: 1})
            .then((questions) => {

                // save 5 random selected questions to the game object
                return Game.findOneAndUpdate(
                    {_id: data.game},
                    {$set: {questions: self.get5RandomQuestionsIds(questions)}}
                );

            }, ExceptionHandlerService.validate)
            .then((game) => {

                // start countdown
                return self.startCountdown(game);

            }, ExceptionHandlerService.validate)
            .then(() => {
                // start game when countdown has been finished
                self.gameIo.sockets.in(data.game).emit('startTheBattle');
            }, ExceptionHandlerService.validate);
    }

    startCountdown(game) {
        return new Promise((resolve) => {
            let count = COUNTDOWN_COUNT;

            let countdownFunc = () => {
                self.gameIo.sockets.in(game._id).emit('startCountdown', {counter: count});

                // decrement counter state
                count--;

                if (count > 0) {
                    setTimeout(countdownFunc, COUNTDOWN_DELAY);
                } else {
                    resolve();
                }
            };

            // start countdown function
            setTimeout(countdownFunc, COUNTDOWN_DELAY);
        });
    }

    get5RandomQuestionsIds(questions) {
        if (questions.length <= 5) {

            return _.map(questions, (q) => {
                return q._id;
            });

        } else {

            let randomQuestions = [];
            let max = questions.length;

            while (randomQuestions.length < 5) {
                let rIndex = Math.floor(Math.random() * (max + 1));
                let rQuestionId = questions[rIndex]._id;
                let found = false;

                for (let i = 0; i < randomQuestions.length; i++) {
                    if (randomQuestions[i]._id == rQuestionId) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    randomQuestions.push(rQuestionId);
                }
            }

            return randomQuestions;
        }
    }
}