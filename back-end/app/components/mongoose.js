/**
 * Created on 19.01.16.
 */

var mongoose = require('mongoose');
var config = require('../config');

mongoose.connect(config.get('mongoose:uri'));

module.exports = mongoose;