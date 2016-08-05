module.exports = {
    BE: {
        CONNECTION: 'connection',
        DISCONNECT: 'disconnect',
        RECONNECT: 'reconnectPlayer',

        CREATE_ROOM: 'createRoom',
        JOIN_ROOM: 'joinRoom',
        REFRESH_ROOM: 'refreshRoom',

        PLAYER_IS_READY: 'playerIsReady',
        ALL_PLAYERS_ARE_READY: 'allPlayersAreReady',

        GET_QUESTION: 'getQuestion',
        ANSWER: 'answer',

        GET_TABLE_SCORE: 'getTableScore'
    },

    FE: {
        PLAYER_RECONNECTED: 'playerReconnected',

        ROOM_CREATED: 'roomCreated',
        PLAYER_JOINED: 'playerJoined',
        GRANT_ADMIN_RIGHTS: 'grantAdminRights',
        UPDATE_ROOM: 'updateRoom',

        PREPARE_GAME_ROOM: 'prepareGameRoom',
        START_COUNTDOWN: 'startCountdown',
        START_BATTLE: 'startTheBattle',

        RECEIVE_QUESTION: 'receiveQuestion',
        SCORE_COUNTDOWN: 'scoreCountdown',
        ANSWER_ACCEPTED: 'answerAccepted',
        DO_REFRESH_CYCLE: 'doRefreshCycle',
        GAME_OVER: 'gameOver',

        REFRESH_SCORE_TABLE: 'refreshScoreTable',

        SERVER_ERROR: 'serverError'
    }
};
