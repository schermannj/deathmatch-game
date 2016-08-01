export interface IPlayerJoinedRoomResponse {
    game: String;
    player: String;
}

export interface IErrorResponse {
    message: String;
}

export interface IJoinRoomResponse {
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