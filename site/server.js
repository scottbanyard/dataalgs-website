"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const fs = require("fs");
const https = require("https");
const http = require("http");
const helmet = require("helmet");
var app = express();
var httpApp = express();
configureHttpApplication(httpApp);
configureApplication(app);
function configureHttpApplication(app) {
    httpApp.set('port', process.env.PORT || 8070);
    httpApp.use(helmet());
    httpApp.get("*", function (req, res, next) {
        res.redirect("https://localhost:8080" + req.path);
    });
    http.createServer(httpApp).listen(httpApp.get('port'), function () {
        console.log('Express HTTP server listening on port ' + httpApp.get('port'));
    });
}
function configureApplication(app) {
    app.set('port', process.env.PORT || 8080);
    var banned = [];
    banUpperCase("./dist/public/", "");
    app.use(helmet());
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
    var sslOptions = {
        key: fs.readFileSync('ssl/server.key'),
        cert: fs.readFileSync('ssl/server.crt'),
    };
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
    var server = https.createServer(sslOptions, app).listen(app.get('port'), function () {
        console.log("Express HTTPS server listening on port " + app.get('port'));
    });
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
