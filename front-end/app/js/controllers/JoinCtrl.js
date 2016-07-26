/**
 * Created on 20.01.16.
 */

app.controller('JoinCtrl', JoinCtrl);

JoinCtrl.$inject = ['$state', 'socket'];

function JoinCtrl($state, socket) {
    var vm = this;

    vm.joinRoom = joinRoom;

    function joinRoom(game, username) {
        socket.io(true)
            .on('serverError', function (resp) {
                alert(resp.message);
            })
            .once('playerJoined', function (resp) {
                $state.go('wait-for-player', resp);
            })
            .emit('joinRoom', {game: game, username: username});
    }
}