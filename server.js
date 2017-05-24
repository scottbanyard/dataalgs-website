"use strict";
exports.__esModule = true;
// set up ========================
var express = require("express");
var morgan = require("morgan");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var fs = require("fs");
var https = require("https");
var http = require("http");
var helmet = require("helmet");
var api_1 = require("./scripts/api");
exports.app = express();
var httpApp = express();
configureHttpApplication(httpApp);
configureApplication(exports.app);
// HTTP Express application used to redirect user to HTTPS Express application
function configureHttpApplication(httpApp) {
    httpApp.set('port', process.env.PORT || 8070);
    httpApp.use(helmet());
    httpApp.get("*", function (req, res, next) {
        res.redirect("https://localhost:8080" + req.path);
    });
    http.createServer(httpApp).listen(httpApp.get('port'), function () {
        console.log('Express HTTP server listening on port ' +
            httpApp.get('port'));
    });
}
// HTTPS Express application
function configureApplication(app) {
    app.set('port', process.env.PORT || 8080);
    var banned = [];
    banUpperCase("./dist/public/", "");
    app.use(helmet());
    app.use(lower);
    app.use(ban);
    // Make the URL lower case.
    function lower(req, res, next) {
        req.url = req.url.toLowerCase();
        next();
    }
    // Forbid access to the URLs in the banned list.
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
    // Read in SSL certificates to provide secure data transmission using HTTPS
    exports.sslOptions = {
        key: fs.readFileSync('ssl/server.key'),
        cert: fs.readFileSync('ssl/server.crt')
    };
    // Check a folder for files/subfolders with non-lowercase names.  Add them to
    // the banned list so they don't get delivered, making the site case sensitive,
    // so that it can be moved from Windows to Linux, for example. Synchronous I/O
    // is used because this function is only called during startup.  This avoids
    // expensive file system operations during normal execution.  A file with a
    // non-lowercase name added while the server is running will get delivered, but
    // it will be detected and banned when the server is next restarted.
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
    // Called by express.static.  Deliver response as XHTML.
    function deliverXHTML(res, path, stat) {
        if (path.endsWith(".html")) {
            res.header("Content-Type", "application/xhtml+xml");
        }
    }
    var options = { setHeaders: deliverXHTML };
    app.use(express.static(__dirname + '/dist/public', options));
    // NB Only dev - logs to console
    app.use(morgan('dev'));
    // Allows API calls to parse JSON
    app.use(bodyParser.urlencoded({ 'extended': false }));
    app.use(bodyParser.json({ type: 'application/json' }));
    // Overrides DELETE and PUT
    app.use(methodOverride());
    // Need to setup API before we start listening
    api_1.setupAPI();
    // Start up secure HTTPS server
    var server = https.createServer(exports.sslOptions, app).listen(app.get('port'), function () {
        return console.log("Express HTTPS server listening on port " + app.get('port'));
    });
}
