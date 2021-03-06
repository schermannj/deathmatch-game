import {provideRouter, RouterConfig} from "@angular/router";
import {CreateRoomComponent} from "../create-room/create-room.component";
import {WaitingRoomComponent} from "../waiting-room/waiting-room.component";
import {JoinRoomComponent} from "../join-room/join-room.component";
import {GameRoomComponent} from "../game-room/game-room.component";
import {ScoreTableRoomComponent} from "../score-table-room/score-table-room.component";
import {NotFoundComponent} from "../not-found/not-found.component";
import {SocketService} from "../../services/socket.service";
import {SocketConnectionGuard} from "./socket-connection-guard.service";

export const routes: RouterConfig = [
    {path: '', component: CreateRoomComponent},
    {path: 'join/:game', component: JoinRoomComponent},
    {path: 'room/:game/:player', component: WaitingRoomComponent, canActivate: [SocketConnectionGuard]},
    {path: 'game/:game/:player', component: GameRoomComponent, canActivate: [SocketConnectionGuard]},
    {path: 'scores/:game', component: ScoreTableRoomComponent},
    {path: '404', component: NotFoundComponent},
    {path: '**', redirectTo: '/404'}
];

export const appRouterProviders = [
    provideRouter(routes),
    SocketConnectionGuard,
    SocketService
];