app.controller('GameCtrl', GameCtrl);

GameCtrl.$inject = ['$state', 'socket', '$scope', '$modal'];

function GameCtrl($state, socket, $scope, $uibModal) {
    var vm = this;

    vm.game = $state.params.game;
    vm.you = $state.params.player;

    vm.score = 0;
    vm.time = 0;
    vm.qIndex = 0;

    getQuestion();

    vm.doAnswer = doAnswer;

    socket.io()
        .on('answerAccepted', function (resp) {
            var modal = $uibModal.open({
                templateUrl: 'templates/answer.modal.html',
                controller: 'AnswerModalInstanceCtrl',
                controllerAs: 'vm',
                size: 'sm',
                resolve: {
                    totalScore: resp.totalScore,
                    isCorrect: resp.isCorrect
                }
            });

            modal.result.then(function () {
                getQuestion();
            });
        })
        .on('receiveQuestion', function (resp) {
            $scope.$apply(function () {
                vm.q = resp.question;
                vm.qScore = resp.qScore;
                vm.totalScore = resp.totalScore;
                vm.qIndex++;
            });
        })
        .on('scoreCountdown', function (resp) {
            $scope.$apply(function () {
                vm.qScore = resp.score;
            });
        });

    function doAnswer() {
        var answer = [];
        //TODO: fix it
        $("input[name*=answer-]:checked").attr('value').forEach(function (item) {
            answer.push(parseInt(item));
        });

        socket.io().emit('answer', {
            game: vm.game,
            player: vm.you,
            q: {
                _id: vm.q.id,
                answer: answer
            }
        });
    }

    function getQuestion() {
        socket.io().emit('getQuestion', {
            game: vm.game,
            player: vm.you,
            qIndex: vm.qIndex
        });
    }
}