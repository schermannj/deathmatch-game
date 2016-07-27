import {provideRouter, RouterConfig}  from '@angular/router';
import {CreateRoomComponent} from '../create-room/create-room.component';
import {WaitingRoomComponent} from "../waiting-room/waiting-room.component";

export const routes: RouterConfig = [
    {path: '', component: CreateRoomComponent},
    {path: 'room/:game/:player', component: WaitingRoomComponent}
];

export const appRouterProviders = [
    provideRouter(routes)
];