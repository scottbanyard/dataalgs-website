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
var sqlite3 = require("sqlite3");
var csprng = require("csprng");
var crypto_1 = require("crypto");
var jwt = require("jsonwebtoken");
var db = new sqlite3.Database('database.sqlite');
var app = express();
var httpApp = express();
configureHttpApplication(httpApp);
configureApplication(app);
var sslOptions;
// http app used to redirect user to https express app
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
    sslOptions = {
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
    // Need to setup API before we listen
    setupApi();
    // Start up secure HTTPS server
    var server = https.createServer(sslOptions, app).listen(app.get('port'), function () {
        return console.log("Express HTTPS server listening on port " + app.get('port'));
    });
}
function setupApi() {
    var router = express.Router();
    // Make sure we don't stop at 1 route
    router.use(function (req, res, next) {
        next();
    });
    // -------------------- API --------------------
    // UNPROTECTED ROUTES (NO TOKEN NEEDED)
    // LOGIN
    router.post('/login', function (req, res) {
        var email = req.body.email;
        var password = req.body.password;
        // CHECK WITH DATABASE HERE USING LOGIN.TS
        attemptLogin(email, password, res);
    });
    // REGISTER
    router.post('/register', function (req, res) {
        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        createNewUser(firstName + lastName, req.body.email, req.body.password, res);
    });
    router.post('/content', function (req, res) {
        var pageID = req.body.pageID;
        db.all('SELECT * FROM Comments WHERE PageID = ?', pageID, function (err, rows) {
            if (err) {
                console.error('Error:', err);
                res.json({ success: false });
            }
            else if (!rows) {
                res.json({ success: false });
            }
            else {
                //  console.log("Successful: ",rows);
                res.json({ success: true, rows: rows });
            }
        });
    });
    // TOKENS NEEDED TO ACCESS REST OF API
    router.use(function (req, res, next) {
        var token = req.body.token || req.query.token || req.headers['x-access-token'];
        // decode token
        if (token) {
            jwt.verify(token, sslOptions.cert, { algorithms: ['RS256'] }, function (err, decoded) {
                if (err) {
                    return res.json({ success: false,
                        message: "Failed to authenticate token." });
                }
                else {
                    req.decoded = decoded;
                    next();
                }
            });
        }
        else {
            // no token provided
            return res.status(403).send({ success: false, message: "No token provided." });
        }
    });
    // PROTECTED ROUTES (TOKEN NEEDED)
    router.post('/makeComment', function (req, res) {
        console.log('Comment made (not)');
    });
    router.post('/changepw', function (req, res) {
        console.log('Change Password api');
        attemptChangePassword(req, res);
    });
    // API always begins with localhost8080/api
    app.use('/api', router);
}
function createToken(id, res) {
    jwt.sign({ userID: id }, sslOptions.key, { algorithm: 'RS256', expiresIn: "10h" }, function (err, token) {
        if (err) {
            console.error("Error creating token: " + err);
        }
        else {
            res.json({ success: true, token: token });
        }
    });
}
function attemptChangePassword(req, res) {
    var userID = req.decoded['userID'];
    db.get('SELECT PassSalt, PassHash, Email FROM UserAccounts WHERE Id = ?', userID, function (err, row) {
        if (err) {
            console.error('Error:', err);
            // res.json({ success: false, error: "Error"});
        }
        else if (!row) {
            console.error('User does not exist');
            res.json({ success: false, error: "User does not exist" });
        }
        else if (hashPW(req.body.user.currentPassword, row.PassSalt) != row.PassHash) {
            res.json({ success: false, error: "Incorrect current password!" });
        }
        else if (hashPW(req.body.user.currentPassword, row.PassSalt) == row.PassHash) {
            changePassword(userID, req.body.user.newPassword, res);
        }
    });
}
// Database specifics
// Hashes a password
function hashPW(password, salt) {
    return crypto_1.createHash('sha256')
        .update(salt + password)
        .digest('hex');
}
function attemptLogin(email, password, res) {
    db.get('SELECT PassSalt, PassHash, Id FROM UserAccounts WHERE Email = ?', email, function (err, row) {
        if (err) {
            console.error('Error:', err);
            res.json({ success: false, error: "Error" });
        }
        else if (!row) {
            console.error('User does not exist');
            res.json({ success: false, error: "User does not exist" });
        }
        else if (hashPW(password, row.PassSalt) == row.PassHash) {
            createToken(row.Id, res);
        }
        else if (hashPW(password, row.PassSalt) != row.PassHash) {
            console.log('Password incorrect');
            res.json({ success: false, error: "Password is incorrect. Please try again." });
        }
    });
}
function createNewUser(name, email, password, res) {
    db.get('SELECT * FROM UserAccounts WHERE Email = ?', email, function (err, row) {
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
            var salt = csprng();
            db.run('INSERT INTO UserAccounts (Name, Email, PassSalt, PassHash) VALUES (?,?,?,?)', [name, email, salt, hashPW(password, salt)]);
            console.log('Account for', email, 'successfully created');
            res.json({ success: true });
        }
    });
}
function changePassword(userID, password, res) {
    var salt = csprng();
    db.run("UPDATE UserAccounts SET PassSalt = ?, PassHash = ? WHERE Id = ?", salt, hashPW(password, salt), userID, function (err, row) {
        if (err) {
            console.log(err);
            res.json({ success: false, error: "Error in database." });
        }
        else {
            res.json({ success: true });
        }
    });
}
