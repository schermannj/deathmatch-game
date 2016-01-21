/**
 * Created on 20.01.16.
 */

'use strict';

var app = angular.module('app', [
        'ui.router',
        'app.config'
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
        })
        .state('join', {
            url: '/join',
            templateUrl: 'templates/main_join.html',
            controller: 'MainCtrl',
            controllerAs: 'vm'
        })
        .state('create', {
            url: '/create',
            templateUrl: 'templates/main_create.html',
            controller: 'MainCtrl',
            controllerAs: 'vm'
        });
}