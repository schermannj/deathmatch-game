export interface IRoomCreatedResponse {
    game: String;
    player: String;
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