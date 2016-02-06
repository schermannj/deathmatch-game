app.controller('GameCtrl', GameCtrl);

GameCtrl.$inject = ['$state', 'socket'];

function GameCtrl($state, socket) {
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
        })
        .on('receiveQuestion', function (resp) {
            vm.question = resp.question;
            vm.possibleAnswers = resp.possibleAnswers;
            vm.qIndex++;
        });

    function doAnswer(answer) {
        socket.io().emit('answer', {});
    }

    function getQuestion() {
        socket.io().emit('getQuestion', {
            game: vm.game,
            qIndex: vm.qIndex
        });
    }
}