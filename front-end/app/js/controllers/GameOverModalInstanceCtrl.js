app.controller('GameOverModalInstanceCtrl', GameOverModalInstanceCtrl);

GameOverModalInstanceCtrl.$inject = ['$uibModalInstance', 'totalScore', 'player'];

function GameOverModalInstanceCtrl($uibModalInstance, totalScore, player) {
    var vm = this;

    vm.totalScore = totalScore;
    vm.player = player;

    vm.openScoreTable = openScoreTable;

    function openScoreTable() {
        $uibModalInstance.close();
    }
}