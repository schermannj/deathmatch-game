import {provideRouter, RouterConfig}  from '@angular/router';
import {CreateRoomComponent} from '../create-room/create-room.component';

export const routes: RouterConfig = [
    {path: '', component: CreateRoomComponent}
];

export const appRouterProviders = [
    provideRouter(routes)
];