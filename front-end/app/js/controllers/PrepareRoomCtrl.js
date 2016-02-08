app.controller('PrepareRoomCtrl', PrepareRoomCtrl);

PrepareRoomCtrl.$inject = ['$state', 'socket'];

function PrepareRoomCtrl($state, socket) {
    var vm = this;

    vm.game = $state.params.game;
    vm.opponent = $state.params.opponent;
    vm.player = $state.params.player;

    vm.ready = ready;

    socket.io()
        .on('opponentIsReady', function () {
            $('.container').append('<h3>Your opponent is ready!</h3>')
        })
        .on('startCountdown', function (resp) {
            $('.container').append('<h3>Game will start in ' + resp.counter + ' !</h3>')
        })
        .on('startTheBattle', function () {
            $state.go('game', {
                player: vm.player,
                game: vm.game
            })
        });

    function ready() {
        socket.io().emit('playerIsReady', {game: vm.game, player: vm.player.name});
    }
}