import {bootstrap} from '@angular/platform-browser-dynamic';
import {enableProdMode} from '@angular/core';
import {disableDeprecatedForms, provideForms} from '@angular/forms';
import {LocalStorageService, LocalStorageSubscriber} from 'angular2-localstorage/LocalStorageEmitter';
import {AppComponent} from './components/app/app.component';
import {appRouterProviders} from './components/app/app.routes';

if (process.env.ENV === 'production') {
    enableProdMode();
}

let appPromise = bootstrap(AppComponent, [
        disableDeprecatedForms(),
        provideForms(),
        appRouterProviders,
        LocalStorageService
    ])
    .catch(err => {
        console.debug(err)
    });

LocalStorageSubscriber(appPromise);