app.controller('GameOverModalInstanceCtrl', GameOverModalInstanceCtrl);

GameOverModalInstanceCtrl.$inject = ['$uibModalInstance', 'player', 'game'];

function GameOverModalInstanceCtrl($uibModalInstance, player, game) {
    var vm = this;

    vm.player = player;
    vm.game = game;

    vm.openScoreTable = openScoreTable;

    function openScoreTable() {
        $uibModalInstance.close();
    }
}