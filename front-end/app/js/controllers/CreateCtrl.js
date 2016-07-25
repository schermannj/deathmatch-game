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
            .on('error', function (resp) {
                alert(resp.message);
            })
            .on('disconnect', function (resp) {
                console.log('disconnect ' + resp)
            })
            .on('reconnect', function (resp) {
                console.log('reconnect ' + resp)
            })
            .on('reconnect_failed', function (resp) {
                console.log('reconnect_failed ' + resp)
            })
            .on('reconnecting', function (resp) {
                console.log('reconnecting ' + resp)
            })
            .once('roomCreated', function (resp) {
                $state.go('wait-for-player', resp)
            })
            .emit('createRoom', {username: username});
    }
}