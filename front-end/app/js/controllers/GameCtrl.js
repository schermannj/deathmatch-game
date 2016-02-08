app.controller('GameCtrl', GameCtrl);

GameCtrl.$inject = ['$state', 'socket', '$scope'];

function GameCtrl($state, socket, $scope) {
    var vm = this;

    vm.game = $state.params.game;
    vm.player = $state.params.player;
    vm.score = 0;
    vm.time = 0;
    vm.qIndex = 0;

    getQuestion();

    vm.doAnswer = doAnswer;

    socket.io()
        .on('answerAccepted', function (resp) {
            console.log(resp);
            //TODO: update view
        })
        .on('receiveQuestion', function (resp) {
            $scope.$apply(function () {
                vm.question = resp.question;
                vm.possibleAnswers = resp.possibleAnswers;
                vm.score = resp.score;
                vm.qIndex++;
            });
        })
        .on('scoreCountdown', function (resp) {
            $scope.$apply(function () {
               vm.score = resp.score;
            });
        });

    function doAnswer(answer) {
        socket.io().emit('answer', {
            pSocket: vm.player.socket,
            game: vm.game,
            qIndex: vm.qIndex,
            qId: vm.question._id,
            answer: answer
        });
    }

    function getQuestion() {
        socket.io().emit('getQuestion', {
            game: vm.game,
            pSocket: vm.player.socket,
            qIndex: vm.qIndex
        });
    }
}


//$("input[name*=radio-choice-]:checked").each(function() {
//    alert($(this).val());
//});