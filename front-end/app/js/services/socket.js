app.factory('socket', socket);

socket.$inject = ['Config'];

function socket(Config) {
    var ioInst = null;

    return {
        io: io
    };

    function io() {
        if(!ioInst) {
            ioInst = window['io'](Config.WS_SERVER_URL);
        }

        return ioInst;
    }
}