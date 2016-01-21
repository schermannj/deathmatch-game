app.controller('PrepareRoomCtrl', PrepareRoomCtrl);

PrepareRoomCtrl.$inject = ['$state', 'socket'];

function PrepareRoomCtrl($state, socket) {
    var vm = this;

    vm.roomId = $state.params.roomId;
    vm.opponent = $state.params.username;

    console.log($state.params);
}