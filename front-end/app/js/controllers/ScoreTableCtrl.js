app.controller('ScoreTableCtrl', ScoreTableCtrl);

ScoreTableCtrl.$inject = ['$state', 'socket', '$scope'];

function ScoreTableCtrl($state, socket, $scope) {
    var vm = this;

    vm.game = $state.params.game;
    vm.players = [];

    refresh();

    socket.io()
        .on('refreshScoreTable', function (resp) {
            $scope.$apply(function () {
                vm.players = resp.players;
            });
        })
        .on('doRefreshCycle', function () {
            refresh();
        });

    function refresh() {
        socket.io().emit('getTableScore', {game: vm.game});
    }
}