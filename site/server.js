"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
var app = express();
configureApplication(app);
function configureApplication(app) {
    app.use(express.static(__dirname + '/dist/public'));
    app.use(morgan('dev'));
    app.use(bodyParser.urlencoded({ 'extended': false }));
    app.use(bodyParser.json({ type: 'application/json' }));
    app.use(methodOverride());
    setupApi();
    app.listen(8080);
    console.log("App listening on port 8080");
}
function setupApi() {
    var router = express.Router();
    app.use('/api', router);
    router.use(function (req, res, next) {
        next();
    });
    router.post('/login', function (req, res) {
        var email = req.body.email;
        var password = req.body.password;
        var error = "error !!!!";
        var success = "0";
        res.json({ success: success, error: error });
    });
    router.post('/register', function (req, res) {
        var name = req.body.firstName;
        var lastname = req.body.lastName;
        var email = req.body.email;
        var password = req.body.password;
        var error = "error !!!!";
        var success = "0";
        res.json({ success: success, error: error });
    });
}
