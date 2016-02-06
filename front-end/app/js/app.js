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
            templateUrl: 'templates/main.html'
        })
        .state('join', {
            url: '/join',
            templateUrl: 'templates/main_join.html',
            controllerAs: 'vm',
            controller: 'JoinCtrl'
        })
        .state('create', {
            url: '/create',
            templateUrl: 'templates/main_create.html',
            controllerAs: 'vm',
            controller: 'CreateCtrl'
        })
        .state('wait-for-player', {
            url: '/wait/:game',
            templateUrl: 'templates/wait_for_player.html',
            controller: 'WaitForPlayerCtrl',
            controllerAs: 'vm'
        })
        .state('prepare-room', {
            url: '/room/:game',
            templateUrl: 'templates/prepare-room.html',
            controller: 'PrepareRoomCtrl',
            controllerAs: 'vm',
            params: {
                opponent: null,
                player: null
            }
        })
        .state('game', {
            templateUrl: 'templates/game-page.html',
            controller: 'GameCtrl',
            controllerAs: 'vm',
            params: {
                player: null,
                game: null
            }
        });
}