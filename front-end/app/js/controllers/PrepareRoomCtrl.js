app.controller('PrepareRoomCtrl', PrepareRoomCtrl);

PrepareRoomCtrl.$inject = ['$state', 'socket'];

function PrepareRoomCtrl($state, socket) {
    var vm = this;

    vm.game = $state.params.game;
    vm.opponent = $state.params.opponent;
}