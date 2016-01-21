/**
 * Created on 20.01.16.
 */

'use strict';

var app = angular.module('app', [
        'ui.router'
    ])
    .config(routerProvider)
    .config(routes);

/*routerProvider config*/

function routerProvider($urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
}

/*routes config*/

function routes($stateProvider) {
    $stateProvider
        .state('main', {
            url: '/',
            templateUrl: 'templates/main.html',
            controller: 'MainCtrl',
            controllerAs: 'vm'
        });
}