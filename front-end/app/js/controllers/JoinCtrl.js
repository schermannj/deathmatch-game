/**
 * Created on 20.01.16.
 */

app.controller('JoinCtrl', JoinCtrl);

JoinCtrl.$inject = ['$state', 'socket'];

function JoinCtrl($state, socket) {
    var vm = this;

    vm.joinRoom = joinRoom;

    socket.io()
        .on('updateRoom', function (resp) {
            $state.go('wait-for-player', resp);
        });

    function joinRoom(game, username) {
        socket.io().emit('joinRoom', {game: game, username: username});
    }
}