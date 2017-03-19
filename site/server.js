"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const fs = require("fs");
var app = express();
configureApplication(app);
function configureApplication(app) {
    var banned = [];
    banUpperCase("./dist/public/", "");
    app.use(lower);
    app.use(ban);
    function lower(req, res, next) {
        req.url = req.url.toLowerCase();
        next();
    }
    function ban(req, res, next) {
        for (var i = 0; i < banned.length; i++) {
            var b = banned[i];
            if (req.url.startsWith(b)) {
                res.status(404).send("Filename not lower case");
                return;
            }
        }
        next();
    }
    function banUpperCase(root, folder) {
        var folderBit = 1 << 14;
        var names = fs.readdirSync(root + folder);
        for (var i = 0; i < names.length; i++) {
            var name = names[i];
            var file = folder + "/" + name;
            if (name != name.toLowerCase())
                banned.push(file.toLowerCase());
            var mode = fs.statSync(root + file).mode;
            if ((mode & folderBit) == 0)
                continue;
            banUpperCase(root, file);
        }
    }
    function deliverXHTML(res, path, stat) {
        if (path.endsWith(".html")) {
            res.header("Content-Type", "application/xhtml+xml");
        }
    }
    var options = { setHeaders: deliverXHTML };
    app.use(express.static(__dirname + '/dist/public', options));
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
        var firstname = req.body.firstName;
        var lastname = req.body.lastName;
        var email = req.body.email;
        var password = req.body.password;
        var error = "error !!!!";
        var success = "1";
        res.json({ success: success, error: error });
    });
}
