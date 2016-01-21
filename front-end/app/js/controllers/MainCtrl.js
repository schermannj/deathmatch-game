/**
 * Created on 20.01.16.
 */

app.controller('MainCtrl', MainCtrl);

MainCtrl.$inject = ['$state', 'socket'];

function MainCtrl($state, socket) {
    var vm = this;

    vm.createRoom = createRoom;
    vm.joinRoom = joinRoom;

    socket.io()
        .on('roomCreated', function (resp) {
            console.log("Room has been created. Data: " + resp);
        });

    function joinRoom(roomId, username) {
        socket.io().emit('joinRoom', {room: roomId, username: username})
    }

    function createRoom(username) {
        socket.io().emit('createRoom', {username: username})
    }
}