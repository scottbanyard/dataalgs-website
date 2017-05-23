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
var markdown_1 = require("./scripts/markdown");
var database = require("./scripts/database");
var app = express();
var httpApp = express();
configureHttpApplication(httpApp);
configureApplication(app);
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
    // Need to setup API before we listen
    setupApi();
    // Start up secure HTTPS server
    var server = https.createServer(exports.sslOptions, app).listen(app.get('port'), function () {
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
        database.attemptLogin(email, password, res);
    });
    // REGISTER
    router.post('/register', function (req, res) {
        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        database.createNewUser(firstName + " " + lastName, req.body.email, req.body.password, res);
    });
    router.get('/getAllPublicPages', database.getAllPublicPages);
    router.post('/allComments', function (req, res) {
        var pageID = req.body.pageID;
        database.db.all('SELECT UserAccounts.Icon, Comments.* FROM Comments INNER JOIN UserAccounts ON UserAccounts.Id = Comments.UserID WHERE Comments.PageID = ?', pageID, function (err, rows) {
            if (err) {
                console.error('Error:', err);
                res.json({ success: false });
            }
            else if (!rows) {
                res.json({ success: false });
            }
            else {
                // Convert each date to local readable date
                for (var i = 0; i < rows.length; i++) {
                    rows[i].Date = database.convertDate(rows[i].Date);
                }
                res.json({ success: true, rows: rows });
            }
        });
    });
    router.post('/loadPage', function (req, res, next) {
        database.db.get('SELECT * FROM Pages WHERE Id = ?', req.body.pageID, function (err, row) {
            if (err) {
                console.error('Error:', err);
                res.json({ success: false });
            }
            else if (!row) {
                res.json({ success: false });
                console.error('Page', req.body.pageID, 'doesn\'t exist!');
            }
            else {
                // Need to be logged in to view
                if (row.PrivateView == 1) {
                    req.page = row;
                    next();
                }
                else {
                    row.Views = row.Views + 1;
                    database.updateViews(req.body.pageID, row.Views);
                    var _a = markdown_1.returnHTML(row.Content, true), html = _a[0], ids = _a[1];
                    database.getImagesFromIDs(res, html, ids, row);
                }
            }
        });
    });
    // TOKENS NEEDED TO ACCESS REST OF API
    router.use(database.checkLoggedIn);
    // PROTECTED ROUTES (TOKEN NEEDED)
    router.post('/loadPage', database.loadPrivatePage);
    router.post('/makeComment', database.makeComment);
    router.post('/savePage', database.saveContent);
    router.post('/changepw', database.attemptChangePassword);
    router.post('/deleteaccount', database.attemptDeleteAccount);
    router.post('/mycomments', database.getMyComments);
    router.post('/deletecomment', database.deleteComment);
    router.post('/mypages', database.getMyPages);
    router.post('/deletepage', database.deletePage);
    router.post('/geticon', database.getProfileIcon);
    router.post('/changeicon', database.changeProfileIcon);
    router.post('/saveimage', database.saveCanvasImage);
    router.post('/getimage', database.getCanvasImage);
    router.post('/getallimages', database.getMyCanvasImages);
    router.post('/updateimage', database.updateCanvasImage);
    router.post('/deleteimage', database.deleteCanvasImage);
    router.post('/previewHTML', database.parseMarkdown);
    router.post('/ratecomment', database.rateComment);
    // API always begins with localhost8080/api
    app.use('/api', router);
}
