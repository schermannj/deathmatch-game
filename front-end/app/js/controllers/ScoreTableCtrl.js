app.controller('ScoreTableCtrl', GameCtrl);

ScoreTableCtrl.$inject = ['$state', 'socket', '$scope'];

function ScoreTableCtrl($state, socket, $scope) {
    var vm = this;

    vm.game = $state.params.game;

    //socket.io()
    //    .on('answerAccepted', function (resp) {
    //        var modal = $uibModal.open({
    //            templateUrl: 'templates/answer.modal.html',
    //            controller: 'AnswerModalInstanceCtrl',
    //            controllerAs: 'vm',
    //            size: 'sm',
    //            resolve: {
    //                totalScore: resp.totalScore,
    //                isCorrect: resp.isCorrect
    //            }
    //        });
    //    });
}