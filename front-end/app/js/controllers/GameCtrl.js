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
                vm.q = {
                    id: resp._id,
                    text: resp.question,
                    possibleAnswers: resp.possibleAnswers,
                    isRadio: resp.isRadio
                };
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
        //TODO: fix here and decide where should i get answer from!
        var answer = $("input[name*=answer-]:checked").attr('value');

        socket.io().emit('answer', {
            player: {
                _id: vm.player._id,
                socket: vm.player.socket
            },
            game: vm.game,
            q: {
                _id: vm.q.id,
                answer: answer
            }
        });
    }

    function getQuestion() {
        socket.io().emit('getQuestion', {
            game: vm.game,
            pSocket: vm.player.socket,
            pId: vm.player._id,
            qIndex: vm.qIndex
        });
    }
}