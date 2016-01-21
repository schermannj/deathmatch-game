/**
 * Created on 20.01.16.
 */

app.controller('MainCtrl', MainCtrl);

MainCtrl.$inject = ['$state', 'socket'];

function MainCtrl($state, socket) {
    var vm = this;

    vm.createRoom = createRoom;
    vm.joinRoom = joinRoom;

    function joinRoom(roomId, username) {
        socket.emit('joinRoom', {room: roomId, username: username})
    }

    function createRoom(username) {
        socket.emit('createRoom', {username: username})
    }
}