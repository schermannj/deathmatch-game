/**
 * Created on 19.01.16.
 */

var nconf = require('nconf');
var path = require('path');

nconf.file({ file: path.join(__dirname, 'config.json') });

module.exports = nconf;