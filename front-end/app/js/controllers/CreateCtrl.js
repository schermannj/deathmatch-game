/**
 * Created on 20.01.16.
 */

app.controller('CreateCtrl', CreateCtrl);

CreateCtrl.$inject = ['$state', 'socket'];

function CreateCtrl($state, socket) {
    var vm = this;

    vm.createRoom = createRoom;

    function createRoom(username) {
        socket.io(true)
            .on('serverError', function (resp) {
                alert(resp.message);
            })
            .once('roomCreated', function (resp) {
                $state.go('wait-for-player', resp)
            })
            .emit('createRoom', {username: username});
    }
}