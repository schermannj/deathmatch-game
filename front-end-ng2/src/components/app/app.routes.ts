import {provideRouter, RouterConfig}  from '@angular/router';
import {CreateRoomComponent} from '../create-room/create-room.component';
import {WaitingRoomComponent} from "../waiting-room/waiting-room.component";
import {JoinRoomComponent} from "../join-room/join-room.component";
import {GameRoomComponent} from "../game-room/game-room.component";
import {ScoreTableRoomComponent} from "../score-table-room/score-table-room.component";
import {NotFoundComponent} from "../not-found/not-found.component";

export const routes: RouterConfig = [
    {path: '', component: CreateRoomComponent},
    {path: 'room/:game/:player', component: WaitingRoomComponent},
    {path: 'join/:game', component: JoinRoomComponent},
    {path: 'game/:game/:player', component: GameRoomComponent},
    {path: 'scores/:game', component: ScoreTableRoomComponent},
    {path: '404', component: NotFoundComponent},
    {path: '**', redirectTo: '/404'}
];

export const appRouterProviders = [
    provideRouter(routes)
];