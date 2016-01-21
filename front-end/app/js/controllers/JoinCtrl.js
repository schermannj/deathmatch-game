/**
 * Created on 20.01.16.
 */

app.controller('JoinCtrl', JoinCtrl);

JoinCtrl.$inject = ['$state', 'socket'];

function JoinCtrl($state, socket) {
    var vm = this;

    vm.joinRoom = joinRoom;

    function joinRoom(roomId, username) {
        socket.io().emit('joinRoom', {roomId: roomId, username: username});

        socket.io()
            .on('playerJoinedRoom', function (resp) {
                $state.go('prepare-room', resp);
            });
    }
}