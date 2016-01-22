app.controller('PrepareRoomCtrl', PrepareRoomCtrl);

PrepareRoomCtrl.$inject = ['$state', 'socket'];

function PrepareRoomCtrl($state, socket) {
    var vm = this;

    vm.game = $state.params.game;
    vm.opponent = $state.params.opponent;
    vm.player = $state.params.player;

    vm.ready = ready;

    function ready() {
        socket.io().emit('playerIsReady', {game: vm.game, player: vm.player});

        socket.io()
            .on('opponentIsReady', function (resp) {
                console.log(resp);

                $('.container').append('<h3>Your opponent is ready</h3>')
            })
            .on('startCountdown', function (resp) {
                console.log(resp)
            })
            .on('startTheBattle', function (resp) {

                console.log(resp)
            })
    }


}