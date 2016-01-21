app.controller('WaitForPlayerCtrl', WaitForPlayerCtrl);

WaitForPlayerCtrl.$inject = ['$state', 'socket'];

function WaitForPlayerCtrl($state, socket) {
    var vm = this;

    vm.roomId = $state.params.roomId;

    console.log($state.params);

    socket.io()
        .on('playerJoinedRoom', function (resp) {
            $state.go('prepare-room', resp);
        });
}