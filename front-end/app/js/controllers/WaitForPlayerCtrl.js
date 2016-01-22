app.controller('WaitForPlayerCtrl', WaitForPlayerCtrl);

WaitForPlayerCtrl.$inject = ['$state', 'socket'];

function WaitForPlayerCtrl($state, socket) {
    var vm = this;

    vm.game = $state.params.game;

    socket.io()
        .on('playerJoinedRoom', function (resp) {
            $state.go('prepare-room', {
                game: resp.game,
                opponent: resp.secondPlayer
            });
        });
}