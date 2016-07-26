import {bootstrap} from '@angular/platform-browser-dynamic';
import {enableProdMode} from '@angular/core';
import {disableDeprecatedForms, provideForms} from '@angular/forms';
import {AppComponent} from './components/app/app.component';

if (process.env.ENV === 'production') {
    enableProdMode();
}

bootstrap(AppComponent, [disableDeprecatedForms(), provideForms()]);