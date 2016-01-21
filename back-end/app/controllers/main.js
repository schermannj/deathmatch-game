/**
 * Created on 13.01.16.
 */

var MainController = require('express').Router();

MainController.get('/', function (req, res, next) {
    res.send("Hello, world!")
});

module.exports = MainController;
