import uuid from 'uuid';
import Game from './models/Game';
import Question from './models/Question';
import Player from './models/Player';
import * as _ from 'lodash';
import ehs from './services/exception-handler.service';
import MongoDumpService from './services/mongo-dump.service';


const DO_MONGO_DUMP = false;
const COUNTDOWN_COUNT = 3;
const COUNTDOWN_DELAY = 1000;
const PLAYER_START_SCORE = 60000;
const SCORE_MIN_DEGREE = 100;
const SCORE_COUNDOWN_DELAY = 100;
const pSocketsScoreMap = {};

let self;
export default class GameModule {

    constructor(io, socket) {
        self = this;

        self.gameIo = io;
        self.gameSocket = socket;

        self.gameSocket.emit('connected', {message: "You are connected!"});
    }

    init() {
        self.gameSocket.on('createRoom', this.createRoomEvent);
        self.gameSocket.on('joinRoom', this.joinRoomEvent);
        self.gameSocket.on('refreshRoom', this.refreshRoom);
        self.gameSocket.on('playerIsReady', this.playerIsReadyEvent);
        self.gameSocket.on('allPlayersAreReady', this.allPlayersAreReady);
        self.gameSocket.on('getQuestion', this.getQuestionEvent);
        self.gameSocket.on('answer', this.answerEvent);
        self.gameSocket.on('getTableScore', this.getTableScore);

        if (DO_MONGO_DUMP) {
            MongoDumpService.doQuestionDump();
        }
    }

    /**
     * @this is a socket obj;
     */
    createRoomEvent(data) {
        let sock = this;
        let savedGame;

        // create a game instance
        new Game({
                _id: uuid.v1({nsecs: 961}),
                questions: [],
                level: data.level ? data.level : 1
            })
            .save()
            .then((game) => {
                // save game instance to local scope
                savedGame = game;

                // create joined player and save it to db
                return new Player({
                    _id: uuid.v1({nsecs: 961}),
                    name: data.username,
                    game: game._id,
                    ready: false,
                    isAdmin: true,
                    socket: sock.id,
                    score: 0,
                    finish: false
                }).save();

            }, ehs.validate)
            .then((player) => {
                // join the game (sock is a socket of joined player)
                sock.join(savedGame._id);

                // send event to FE, to the joined player
                sock.emit('roomCreated', {
                    game: savedGame._id,
                    you: player
                });

            }, ehs.validate);
    }

    /**
     * @this is a socket obj;
     */
    joinRoomEvent(data) {
        let sock = this;

        // If the game exists...
        if (!self.validateGameExistance(data.game, sock)) {
            return;
        }

        // create new player
        new Player({
                _id: uuid.v1({nsecs: 961}),
                name: data.username,
                game: data.game,
                ready: false,
                isAdmin: false,
                socket: sock.id,
                score: 0,
                finish: false
            })
            .save()
            .then((player) => {
                // join the new player to the game
                sock.join(data.game);

                // send event to all players from this game
                self.gameIo.sockets.in(data.game).emit('playerJoined', {
                    game: data.game,
                    you: player
                });

            }, ehs.validate);
    }

    /**
     * @this is a socket obj;
     */
    refreshRoom(data) {
        // find all players who belongs to this game
        Player.find({game: data.game})
            .then((players) => {

                // send event to all players from this game
                self.gameIo.sockets.in(data.game).emit('updateRoom', {
                    game: data.game,
                    players: players
                });

            }, ehs.validate);
    }

    /**
     * @this is a socket obj;
     */
    playerIsReadyEvent(data) {
        if (!self.validateGameExistance(data.game, this)) {
            return;
        }

        // find player with specific id and game and update his ready status
        Player.findOneAndUpdate({_id: data.player._id, game: data.game}, {$set: {ready: true}})
            .then(() => {

                // find all players from that game
                return Player.find({game: data.game});

            }, ehs.validate)
            .then((players) => {

                // send updated status to all players from the game
                self.gameIo.sockets.in(data.game).emit('updateRoom', {players: players});

            }, ehs.validate);
    }

    /**
     * @this is a socket obj;
     */
    allPlayersAreReady(data) {
        if (!self.validateGameExistance(data.game, this)) {
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

            }, ehs.validate)
            .then((game) => {

                // start countdown
                return self.startCountdown(game);

            }, ehs.validate)
            .then(() => {
                // start game when countdown has been finished
                self.gameIo.sockets.in(data.game).emit('startTheBattle');
            }, ehs.validate);
    }

    /**
     * @this is a socket obj;
     */
    getQuestionEvent(data) {
        let sock = this;

        if (!self.validateGameExistance(data.game, sock)) {
            return;
        }

        // find game object
        Game.findOne({_id: data.game})
            .then((game) => {
                ehs.assertNotNull(game);

                // check if question index < game questions count
                if (data.qIndex >= game.questions.length) {
                    console.debug(`Invalid question index - ${data.qIndex}`);

                    sock.emit('error', {message: `Something went wrong - invalid question index. Seems 
                                                    like you're going to lose this game...`});
                    return;
                }

                // get next question and player
                return Promise.all([
                    Question.findOne({_id: game.questions[data.qIndex]}),
                    Player.findOne({_id: data.player._id})
                ]);

            }, ehs.validate)
            .then((resolveArray) => {

                // check resolve array (length has to be 2 - question and player)
                if(resolveArray.length != 2) {
                    console.debug(`Invalid resolve array length - ${resolveArray.length}`);

                    sock.emit('error', {message: `Something went wrong - invalid resolve array length.`});

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

            }, ehs.validate)
    }

    /**
     * @this is a socket obj;
     */
    answerEvent(data) {
        let sock = this;

        if (!self.validateGameExistance(data.game, sock)) {
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
                    console.debug(`Invalid resolve array length - ${resolveArray.length}`);

                    sock.emit('error', {message: `Something went wrong - invalid resolve array length.`});

                    return;
                }

                // define game and question variables
                let game = resolveArray[0];
                let question = resolveArray[1];

                ehs.assertNotNull(game);

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
                    updateDocument['$set'] = {finish: true};
                }

                // update player info and return updated document
                return Player.findOneAndUpdate({_id: data.player._id, game: data.game}, updateDocument, {new: true});

            }, ehs.validate)
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
            }, ehs.validate);
    }

    /**
     * @this is a socket obj;
     */
    getTableScore(req) {
        //TODO: check it
        var sock = this;

        Game.findOne({_id: req.game})
            .then(function (game) {
                ehs.assertNotNull(game);
                //TODO: this doesn't work.
                return q.all([
                    Player.count({_id: {$in: game.players}}),
                    Player.find({_id: {$in: game.players}, finish: true}),
                    Player.find({_id: {$in: game.players}})
                ])
            }, ehs.validate)
            .then(function (allPlayersCount, finishedPlayers) {
                //collect score table data
                var scoreTableData = _.map(players, function (player) {
                    return {
                        name: player.name,
                        score: player.score
                    }
                });

                var resp = {
                    players: scoreTableData
                };

                if (allPlayersCount === players.length) {
                    resp.winner = _.max(players, function (player) {
                        return player.score;
                    });
                }

                //send new data
                sock.emit('refreshScoreTable', resp);
            }, ehs.validate);
    }

    putScoreToMap(pSocket, score) {
        pSocketsScoreMap[pSocket] = {
            score: score,
            inAction: true
        }
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
                setTimeout(countdown, SCORE_COUNDOWN_DELAY);
            }

            // save player's score state to the map;
            self.putScoreToMap(pSocket.id, score);
        };

        setTimeout(countdown, SCORE_COUNDOWN_DELAY);
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

    doesGameExist(game) {
        // Look up the game ID in the Socket.IO manager object.
        return self.gameSocket.adapter.rooms[game];
    }

    validateGameExistance(game, sock) {
        if (!self.doesGameExist(game)) {
            sock.emit('error', {message: "This game does not exist anymore."});

            return false;
        }

        return true;
    }
}
