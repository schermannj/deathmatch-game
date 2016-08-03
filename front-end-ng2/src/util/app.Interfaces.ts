export interface IPlayerRoomResponse {
    game: String;
    player: String;
}

export interface IErrorResponse {
    message: String;
}

export interface IGameResponse {
    game: String;
}

export interface IPlayer {
    _id: String;
    isAdmin: boolean;
    game: String;
    name: String;
    score: Number;
    state: String;
}

export interface IPossibleAnswer {
    index: Number;
    text: String;
}

export interface IQuestion {
    id: String;
    isRadio: boolean;
    text: String;
    possibleAnswers: Array<IPossibleAnswer>;

}

export interface IScoreCountdownResponse {
    score: Number;
}

export interface IReceiveQuestionResponse {
    qScore: Number;
    totalScore: Number;
    question: IQuestion;
}

export interface IUpdateRoomResponse {
    game: String;
    players: Array<IPlayer>;
}

export interface ICountdownParams {
    enabled: boolean;
    time?: Number;
}

export interface IStartCountdownResponse {
    counter: Number
}

export interface IAnswerAcceptedResponse {
    isCorrect: boolean;
    totalScore: number;
}

export interface IGameOverResponse {
    score: number;
    game: String;
}

export interface IScoreTableResponse {
    winner?: IPlayer;
    players: Array<IPlayer>;
}

export interface ISessionStorageState {
    game?: String;
    player?: {
        id: String;
    };
    status?:String;
}