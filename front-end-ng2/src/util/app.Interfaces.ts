export interface IPlayerRoomResponse {
    game: string;
    player: string;
}

export interface IErrorResponse {
    message: string;
}

export interface IGameResponse {
    game: string;
}

export interface IPlayer {
    _id: string;
    isAdmin: boolean;
    game: string;
    name: string;
    score: number;
    state: string;
}

export interface IPossibleAnswer {
    index: number;
    text: string;
}

export interface IQuestion {
    id: string;
    isRadio: boolean;
    text: string;
    possibleAnswers: Array<IPossibleAnswer>;

}

export interface IScoreCountdownResponse {
    score: number;
}

export interface IReceiveQuestionResponse {
    qScore: number;
    totalScore: number;
    question: IQuestion;
}

export interface IUpdateRoomResponse {
    game: string;
    players: Array<IPlayer>;
}

export interface ICountdownParams {
    enabled: boolean;
    time?: number;
}

export interface IStartCountdownResponse {
    counter: number
}

export interface IAnswerAcceptedResponse {
    isCorrect: boolean;
    totalScore: number;
}

export interface IGameOverResponse {
    score: number;
    game: string;
}

export interface IScoreTableResponse {
    winner?: IPlayer;
    players: Array<IPlayer>;
}

export interface ISessionStorageState {
    game?: string;
    player?: {
        id: string;
    };
    status?:string;
}