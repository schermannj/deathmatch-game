import {provideRouter, RouterConfig}  from '@angular/router';
import {CreateRoomComponent} from '../create-room/create-room.component';
import {WaitingRoomComponent} from "../waiting-room/waiting-room.component";
import {JoinRoomComponent} from "../join-room/join-room.component";
import {GameRoomComponent} from "../game-room/game-room.component";

export const routes: RouterConfig = [
    {path: '', component: CreateRoomComponent},
    {path: 'room/:game/:player', component: WaitingRoomComponent},
    {path: 'join/:game', component: JoinRoomComponent},
    {path: 'game/:game/:player', component: GameRoomComponent}
];

export const appRouterProviders = [
    provideRouter(routes)
];