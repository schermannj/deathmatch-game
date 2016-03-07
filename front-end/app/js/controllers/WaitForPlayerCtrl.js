app.controller('WaitForPlayerCtrl', WaitForPlayerCtrl);

WaitForPlayerCtrl.$inject = ['$state', 'socket', '$scope'];

function WaitForPlayerCtrl($state, socket, $scope) {
    var vm = this;

    vm.game = $state.params.game;
    vm.you = $state.params.you;
    vm.players = $state.params.players;

    vm.doReady = doReady;

    socket.io()
        .on('updateRoom', function (resp) {
            $scope.$apply(function () {
                vm.players = resp.players;
            });

            checkIfAllPlayersAreReady();
        })
        .on('startCountdown', function (resp) {
            $('.container').append('<h3>Game will start in ' + resp.counter + ' !</h3>')
        })
        .on('startTheBattle', function () {
            $state.go('game', {
                player: vm.you,
                game: vm.game
            })
        });



    function checkIfAllPlayersAreReady() {
        var allAreReady = _.where(vm.players, {ready: false}).length == 0;

        if (allAreReady) {
            socket.io().emit('allPlayersAreReady', {game: vm.game});
        }
    }

    function doReady() {
        socket.io().emit('playerIsReady', {game: vm.game, player: vm.you});
    }
}