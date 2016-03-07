/**
 * Created on 20.01.16.
 */

app.controller('AnswerModalInstanceCtrl', AnswerModalInstanceCtrl);

AnswerModalInstanceCtrl.$inject = ['$uibModalInstance', 'totalScore', 'isCorrect'];

function AnswerModalInstanceCtrl($uibModalInstance, totalScore, isCorrect) {
    var vm = this;

    vm.totalScore = totalScore;
    vm.isCorrect = isCorrect;

    vm.next = next;

    function next() {
        $uibModalInstance.close();
    }
}