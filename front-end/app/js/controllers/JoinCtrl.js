/**
 * Created on 20.01.16.
 */

app.controller('JoinCtrl', JoinCtrl);

JoinCtrl.$inject = ['$state', 'socket'];

function JoinCtrl($state, socket) {
    var vm = this;

    vm.joinRoom = joinRoom;

    function joinRoom(game, username) {
        socket.io().emit('joinRoom', {game: game, username: username});

        socket.io()
            .on('playerJoinedRoom', function (resp) {
                $state.go('prepare-room', {
                    game: resp.game,
                    opponent: resp.firstPlayer
                });
            });
    }
}