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
const sqlite3 = require("sqlite3");
const csprng = require("csprng");
const crypto_1 = require("crypto");
const jwt = require("jsonwebtoken");
var db = new sqlite3.Database('database.sqlite');
var app = express();
var httpApp = express();
configureHttpApplication(httpApp);
configureApplication(app);
var sslOptions;
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
    sslOptions = {
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
    var server = https.createServer(sslOptions, app).listen(app.get('port'), () => console.log("Express HTTPS server listening on port " + app.get('port')));
}
function setupApi() {
    var router = express.Router();
    router.use(function (req, res, next) {
        next();
    });
    router.post('/login', function (req, res) {
        var email = req.body.email;
        var password = req.body.password;
        attemptLogin(email, password, res);
    });
    router.post('/register', function (req, res) {
        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        createNewUser(firstName + lastName, req.body.email, req.body.password, res);
    });
    router.post('/content', function (req, res) {
        var pageID = req.body.pageID;
        db.all('SELECT * FROM Comments WHERE PageID = ?', pageID, (err, rows) => {
            if (err) {
                console.error('Error:', err);
                res.json({ success: false });
            }
            else if (!rows) {
                res.json({ success: false });
            }
            else {
                console.log("Successful: ", rows);
                res.json({ success: true, rows: rows });
            }
        });
    });
    router.use(function (req, res, next) {
        var token = req.body.token || req.query.token || req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, sslOptions.crt, (err, decoded) => {
                if (err) {
                    return res.json({ success: false, message: "Failed to authenticate token." });
                }
                else {
                    req.decoded = decoded;
                    next();
                }
            });
        }
        else {
            return res.status(403).send({ success: false, message: "No token provided." });
        }
    });
    router.post('/makeComment', function (req, res) {
        console.log('Comment made (not)');
    });
    app.use('/api', router);
}
function createToken(email, res) {
    jwt.sign({ email: email }, sslOptions.key, { algorithm: 'RS256', expiresIn: "10h" }, (err, token) => {
        if (err) {
            console.error("Error creating token: " + err);
        }
        else {
            console.log("Token: " + token);
            res.json({ success: true, token: token });
        }
    });
}
function hashPW(password, salt) {
    return crypto_1.createHash('sha256')
        .update(salt + password)
        .digest('hex');
}
function attemptLogin(email, password, res) {
    db.get('SELECT PassSalt, PassHash FROM UserAccounts WHERE Email = ?', email, (err, row) => {
        if (err) {
            console.error('Error:', err);
            res.json({ success: false, error: "Error" });
        }
        else if (!row) {
            console.error('User does not exist');
            res.json({ success: false, error: "User does not exist" });
        }
        else if (hashPW(password, row.PassSalt) == row.PassHash) {
            console.log('Password correct');
            createToken(email, res);
        }
        else if (hashPW(password, row.PassSalt) != row.PassHash) {
            console.log('Password incorrect');
            res.json({ success: false, error: "Password is incorrect. Please try again." });
        }
    });
}
function createNewUser(name, email, password, res) {
    db.get('SELECT * FROM UserAccounts WHERE Email = ?', email, (err, row) => {
        if (err) {
            console.error('Error:', err);
            res.json({ success: false, error: "Error" });
        }
        else if (row) {
            console.warn('That email:', email, 'already exists in our system');
            res.json({ success: false,
                error: "Email already exists in our system" });
        }
        else {
            const salt = csprng();
            db.run('INSERT INTO UserAccounts (Name, Email, PassSalt, PassHash) VALUES (?,?,?,?)', [name, email, salt, hashPW(password, salt)]);
            console.log('Account for', email, 'successfully created');
            res.json({ success: true });
        }
    });
}
