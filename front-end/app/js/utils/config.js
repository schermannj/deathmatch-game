angular.module('app.config', [])
    .constant('Config', config());

function config() {
    return {
        SERVER_URL: 'http://localhost:3000',
        WS_SERVER_URL : 'http://localhost:8089/'
    }
}