export default class PlayerScoreHolder {

    constructor() {
        this._socketStateMap = {};
    }

    put(socket, score) {
        this._socketStateMap[socket] = {
            score: score,
            inAction: true
        }
    }

    setInAction(socket, inAction) {
        let playerSocketState = this._socketStateMap[socket];

        if (playerSocketState) {
            playerSocketState.inAction = inAction;
        }
    }

    getInAction(socket) {
        let playerSocketState = this._socketStateMap[socket];

        if (playerSocketState) {
            return playerSocketState.inAction;
        }
    }

    getScore(socket) {
        let playerSocketState = this._socketStateMap[socket];

        if (playerSocketState) {
            return playerSocketState.score;
        }
    }

    setScore(socket, score) {
        let playerSocketState = this._socketStateMap[socket];

        if (playerSocketState) {
            playerSocketState.score = score;
        }
    }
}