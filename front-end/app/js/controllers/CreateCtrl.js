/**
 * Created on 20.01.16.
 */

app.controller('CreateCtrl', CreateCtrl);

CreateCtrl.$inject = ['$state', 'socket'];

function CreateCtrl($state, socket) {
    var vm = this;

    vm.createRoom = createRoom;

    socket.io(true)
        .on('roomCreated', function (resp) {
            $state.go('wait-for-player', resp)
        });

    function createRoom(username) {
        socket.io().emit('createRoom', {username: username})
    }
}