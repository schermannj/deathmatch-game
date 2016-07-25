/**
 * Created on 20.01.16.
 */

app.controller('JoinCtrl', JoinCtrl);

JoinCtrl.$inject = ['$state', 'socket'];

function JoinCtrl($state, socket) {
    var vm = this;

    vm.joinRoom = joinRoom;

    socket.io()
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
        .once('playerJoined', function (resp) {
            $state.go('wait-for-player', resp);
        });

    function joinRoom(game, username) {
        socket.io().emit('joinRoom', {game: game, username: username});
    }
}