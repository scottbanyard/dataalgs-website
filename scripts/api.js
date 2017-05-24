"use strict";
exports.__esModule = true;
var express = require("express");
var markdown_1 = require("./markdown");
var database = require("./database");
var jwt_auth_1 = require("./jwt-auth");
var server_1 = require("../server");
// All methods within this function uses the Express Router to configure and start our own API
function setupAPI() {
    // Create our new API router
    var router = express.Router();
    // Make sure we don't stop at 1 route, go to the next
    router.use(function (req, res, next) {
        next();
    });
    // -------------------- API --------------------
    // ****** UNPROTECTED ROUTES (NO TOKEN NEEDED) ******
    /*
      URL - https://localhost:8080/api/login
      Method - POST
      Data Params - {email, password}
      Success Response - Code 200, Content {success: true}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/login', function (req, res) {
        var email = req.body.email;
        var password = req.body.password;
        database.attemptLogin(email, password, res);
    });
    /*
      URL - https://localhost:8080/api/register
      Method - POST
      Data Params - {firstname, lastname, email, password}
      Success Response - Code 200, Content {success: true}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/register', function (req, res) {
        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        database.createNewUser(firstName + " " + lastName, req.body.email, req.body.password, res);
    });
    /*
      URL - https://localhost:8080/api/getAllPublicPages
      Method - GET
      Data Params - n/a
      Success Response - Code 200, Content {success: true, pages: pages}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.get('/getAllPublicPages', database.getAllPublicPages);
    /*
      URL - https://localhost:8080/api/allComments
      Method - POST
      Data Params - {page ID}
      Success Response - Code 200, Content {success: true, pages: pages}
      Error Response -  Code 200, Content {success: false, error: message}
    */
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
    /*
      URL - https://localhost:8080/api/loadPage
      Method - POST
      Data Params - {page ID}
      Success Response - Code 200, Content {success: true, page: page}
      Error Response -  Code 200, Content {success: false, error: message}
    */
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
    // JSON WEB TOKENS NEEDED TO ACCESS REST OF API
    /*
      This uses the JSON Web Token node module to verify the token.
      Success Response - Code 200, next route
      Error Response -  Code 403, Content {success: false, error: message}
    */
    router.use(jwt_auth_1.checkLoggedIn);
    // ****** PROTECTED ROUTES (TOKEN NEEDED) ******
    /*
      URL - https://localhost:8080/api/loadPage
      Method - POST
      Data Params - {token, page ID}
      Success Response - Code 200, Content {success: true, page: page}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/loadPage', database.loadPrivatePage);
    /*
      URL - https://localhost:8080/api/makeComment
      Method - POST
      Data Params - {token, time, comment.title, comment.body, page ID}
      Success Response - Code 200, Content {success: true}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/makeComment', database.makeComment);
    /*
      URL - https://localhost:8080/api/savePage
      Method - POST
      Data Params - {token, title, content, private-view, private-edit, time, views}
      Success Response - Code 200, Content {success: true}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/savePage', database.saveContent);
    /*
      URL - https://localhost:8080/api/changepw
      Method - POST
      Data Params - {token, current-password, new-password}
      Success Response - Code 200, Content {success: true}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/changepw', database.attemptChangePassword);
    /*
      URL - https://localhost:8080/api/deleteaccount
      Method - POST
      Data Params - {token, current-password}
      Success Response - Code 200, Content {success: true}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/deleteaccount', database.attemptDeleteAccount);
    /*
      URL - https://localhost:8080/api/mycomments
      Method - POST
      Data Params - {token}
      Success Response - Code 200, Content {success: true, comments : allmycomments}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/mycomments', database.getMyComments);
    /*
      URL - https://localhost:8080/api/deletecomment
      Method - POST
      Data Params - {token, comment ID}
      Success Response - Code 200, Content {success: true}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/deletecomment', database.deleteComment);
    /*
      URL - https://localhost:8080/api/mypages
      Method - POST
      Data Params - {token}
      Success Response - Code 200, Content {success: true, pages: allmypages}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/mypages', database.getMyPages);
    /*
      URL - https://localhost:8080/api/deletepage
      Method - POST
      Data Params - {token, page ID}
      Success Response - Code 200, Content {success: true}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/deletepage', database.deletePage);
    /*
      URL - https://localhost:8080/api/geticon
      Method - POST
      Data Params - {token}
      Success Response - Code 200, Content {success: true, icon: myicon}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/geticon', database.getProfileIcon);
    /*
      URL - https://localhost:8080/api/changeicon
      Method - POST
      Data Params - {token, new-icon}
      Success Response - Code 200, Content {success: true}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/changeicon', database.changeProfileIcon);
    /*
      URL - https://localhost:8080/api/saveimage
      Method - POST
      Data Params - {token, name, dimensions, shapes}
      Success Response - Code 200, Content {success: true}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/saveimage', database.saveCanvasImage);
    /*
      URL - https://localhost:8080/api/getimage
      Method - POST
      Data Params - {token, canvas ID}
      Success Response - Code 200, Content {success: true, image: myimage}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/getimage', database.getCanvasImage);
    /*
      URL - https://localhost:8080/api/getallimages
      Method - POST
      Data Params - {token}
      Success Response - Code 200, Content {success: true, images: allmyimages}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/getallimages', database.getMyCanvasImages);
    /*
      URL - https://localhost:8080/api/updateimage
      Method - POST
      Data Params - {token, canvas ID, name, dimensions, shapes}
      Success Response - Code 200, Content {success: true}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/updateimage', database.updateCanvasImage);
    /*
      URL - https://localhost:8080/api/deleteimage
      Method - POST
      Data Params - {token, canvas ID}
      Success Response - Code 200, Content {success: true}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/deleteimage', database.deleteCanvasImage);
    /*
      URL - https://localhost:8080/api/previewHTML
      Method - POST
      Data Params - {token, markdown}
      Success Response - Code 200, Content {success: true, html: parsed-markdown}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/previewHTML', database.parseMarkdown);
    /*
      URL - https://localhost:8080/api/ratecomment
      Method - POST
      Data Params - {token, commentID, new-rating}
      Success Response - Code 200, Content {success: true}
      Error Response -  Code 200, Content {success: false, error: message}
    */
    router.post('/ratecomment', database.rateComment);
    // API always begins with localhost8080/api
    server_1.app.use('/api', router);
}
exports.setupAPI = setupAPI;
