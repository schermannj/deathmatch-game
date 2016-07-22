app.factory('socket', socket);

socket.$inject = ['Config'];

function socket(Config) {
    var _io = null;

    return {
        io: io
    };

    function io(recreate) {
        if(!_io || recreate) {
            _io = window['io'](Config.WS_SERVER_URL);
        }

        return _io;
    }
}