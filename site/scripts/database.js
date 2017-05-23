"use strict";
exports.__esModule = true;
var sqlite3 = require("sqlite3");
var csprng = require("csprng");
var crypto_1 = require("crypto");
var markdown_1 = require("./markdown");
var jwt_auth_1 = require("./jwt-auth");
// Creates the embedded database using SQLite3
exports.db = new sqlite3.Database('database.sqlite');
function parseMarkdown(req, res) {
    var _a = markdown_1.returnHTML(req.body.content, false), thisHTML = _a[0], ids = _a[1];
    getImagesFromIDs(res, thisHTML, ids, undefined, req.decoded['userID']);
}
exports.parseMarkdown = parseMarkdown;
// Converts date from number stored in database to local date
function convertDate(date) {
    return new Date(date).toLocaleDateString();
}
exports.convertDate = convertDate;
// Database specifics
// Hashes a password
function hashPW(password, salt) {
    return crypto_1.createHash('sha256')
        .update(salt + password)
        .digest('hex');
}
exports.hashPW = hashPW;
function attemptLogin(email, password, res) {
    exports.db.get('SELECT PassSalt, PassHash, Id, Name FROM UserAccounts WHERE Email = ?', email, function (err, row) {
        if (err) {
            console.error('Error:', err);
            res.json({ success: false, error: "Error" });
        }
        else if (!row) {
            console.error('User does not exist');
            res.json({ success: false, error: "User does not exist" });
        }
        else if (hashPW(password, row.PassSalt) == row.PassHash) {
            jwt_auth_1.createToken(row.Id, row.Name, res);
        }
        else if (hashPW(password, row.PassSalt) != row.PassHash) {
            console.log('Password incorrect');
            res.json({ success: false, error: "Password is incorrect. Please try again." });
        }
    });
}
exports.attemptLogin = attemptLogin;
function createNewUser(name, email, password, res) {
    exports.db.get('SELECT * FROM UserAccounts WHERE Email = ?', email, function (err, row) {
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
            exports.db.run('INSERT INTO UserAccounts (Name, Email, PassSalt, PassHash, Icon) VALUES (?,?,?,?,?)', [name, email, salt, hashPW(password, salt), "man.svg"]);
            console.log('Account for', email, 'successfully created');
            res.json({ success: true });
        }
    });
}
exports.createNewUser = createNewUser;
function attemptChangePassword(req, res) {
    var userID = req.decoded['userID'];
    exports.db.get('SELECT PassSalt, PassHash, Email FROM UserAccounts WHERE Id = ?', userID, function (err, row) {
        if (err) {
            console.error('Error:', err);
            res.json({ success: false, error: "Error" });
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
exports.attemptChangePassword = attemptChangePassword;
function changePassword(userID, password, res) {
    var salt = csprng();
    exports.db.run("UPDATE UserAccounts SET PassSalt = ?, PassHash = ? WHERE Id = ?", salt, hashPW(password, salt), userID, function (err, row) {
        if (err) {
            console.log(err);
            res.json({ success: false, error: "Error in database." });
        }
        else {
            res.json({ success: true });
        }
    });
}
exports.changePassword = changePassword;
function attemptDeleteAccount(req, res) {
    var userID = req.decoded['userID'];
    exports.db.get('SELECT PassSalt, PassHash, Email FROM UserAccounts WHERE Id = ?', userID, function (err, row) {
        if (err) {
            console.error('Error:', err);
            res.json({ success: false, error: "Error" });
        }
        else if (!row) {
            console.error('User does not exist');
            res.json({ success: false, error: "User does not exist" });
        }
        else if (hashPW(req.body.user.currentPassword, row.PassSalt) != row.PassHash) {
            res.json({ success: false, error: "Incorrect current password!" });
        }
        else if (hashPW(req.body.user.currentPassword, row.PassSalt) == row.PassHash) {
            deleteAccount(userID, res);
        }
    });
}
exports.attemptDeleteAccount = attemptDeleteAccount;
function deleteAccount(userID, res) {
    exports.db.run("DELETE FROM UserAccounts WHERE Id = ?", userID, function (err) {
        if (err) {
            console.error("Error: " + err);
            res.json({ success: false, error: "Error" });
        }
        else {
            res.json({ success: true });
        }
    });
}
exports.deleteAccount = deleteAccount;
function loadPrivatePage(req, res) {
    var userID = req.decoded['userID'];
    var pageCreator = req.page.Creator;
    if (pageCreator == userID) {
        req.page.Views = req.page.Views + 1;
        updateViews(req.body.pageID, req.page.Views);
        var _a = markdown_1.returnHTML(req.page.Content, true), thisHTML = _a[0], ids = _a[1];
        getImagesFromIDs(res, thisHTML, ids, req.page, userID);
    }
    else {
        res.json({ success: false,
            error: "Not authorised - don't own the private page."
        });
    }
}
exports.loadPrivatePage = loadPrivatePage;
function saveContent(req, res) {
    var userID = req.decoded['userID'];
    exports.db.get('SELECT * FROM Pages WHERE Id = ?', req.body.pageID, function (err, row) {
        if (err) {
            console.error('Error:', err);
            res.json({ success: false });
        }
        else if (!row) {
            // Serially execute two queries
            exports.db.serialize(function () {
                // Insert new row with 0 views
                exports.db.run('INSERT INTO Pages (Title, Content, PrivateView, Creator, PrivateEdit, LastEdit, Views) VALUES (?,?,?,?,?,?,?)', [req.body.Title,
                    req.body.Content,
                    req.body.PrivateView,
                    userID,
                    req.body.PrivateEdit,
                    req.body.LastEdit,
                    0]);
                // Get auto incremented value generated in table for that inserted page, and return it
                exports.db.get('SELECT Id FROM Pages WHERE LastEdit = ? AND Creator = ?', req.body.LastEdit, userID, function (err, row) {
                    res.json({ success: true, id: row.Id });
                });
            });
        }
        else {
            // update existing row
            exports.db.run("UPDATE Pages SET Title = ?, Content = ?, PrivateView = ?, PrivateEdit = ?, LastEdit = ?, Views = ? WHERE Id = ?", req.body.Title, req.body.Content, req.body.PrivateView, req.body.PrivateEdit, req.body.LastEdit, req.body.Views + 1, req.body.pageID);
            res.json({ success: true });
        }
    });
}
exports.saveContent = saveContent;
function makeComment(req, res) {
    exports.db.run('INSERT INTO Comments (UserID, Date, Title, Content, PageID, Name) VALUES (?,?,?,?,?,?)', [req.decoded['userID'],
        req.body.time,
        req.body.comment.title,
        req.body.comment.body,
        req.body.pageID,
        req.decoded['name']]);
}
exports.makeComment = makeComment;
function getMyComments(req, res) {
    var userID = req.decoded['userID'];
    var comments = [];
    var commentNumber = 0;
    exports.db.each('SELECT * FROM Comments WHERE UserId = ?', userID, function (err, row) {
        if (err) {
            console.error('Error:', err);
            res.json({ success: false, error: "Error - please check your connection." });
        }
        else if (!row) {
            console.error('User does not exist');
            res.json({ success: false, error: "You have not made any comments. Start today!" });
        }
        else {
            row.Date = convertDate(row.Date);
            comments[commentNumber] = row;
            commentNumber++;
        }
    }, function (err, row) {
        if (commentNumber > 0) {
            res.json({ success: true, comments: comments });
        }
        else {
            res.json({ success: false, error: "You have not made any comments. Start today!" });
        }
    });
}
exports.getMyComments = getMyComments;
function deleteComment(req, res) {
    exports.db.run("DELETE FROM Comments WHERE CommentID = ?", req.body.commentID, function (err) {
        if (err) {
            console.error("Error: " + err);
            res.json({ success: false, error: "Error" });
        }
        else {
            res.json({ success: true });
        }
    });
}
exports.deleteComment = deleteComment;
function getAllPublicPages(req, res) {
    exports.db.all("SELECT Id, Title, Creator, LastEdit, Views FROM Pages WHERE PrivateView = 0", function (err, rows) {
        if (err) {
            res.json({ success: false, error: "Error" });
        }
        else if (!rows) {
            res.json({ success: false, error: "There are no public pages currently!" });
        }
        else {
            rows.forEach(function (row) {
                row.LastEdit = convertDate(row.LastEdit);
            });
            res.json({ success: true, pages: rows });
        }
    });
}
exports.getAllPublicPages = getAllPublicPages;
function getMyPages(req, res) {
    var userID = req.decoded['userID'];
    var pages = [];
    var pageNumber = 0;
    exports.db.each('SELECT * FROM Pages WHERE Creator = ?', userID, function (err, row) {
        if (err) {
            console.error('Error:', err);
            res.json({ success: false, error: "Error - please check your connection." });
        }
        else if (!row) {
            res.json({ success: false, error: "You have not made any pages. Start today using the Create tab!" });
        }
        else {
            row.LastEdit = convertDate(row.LastEdit);
            pages[pageNumber] = row;
            pageNumber++;
        }
    }, function (err, row) {
        if (pageNumber > 0) {
            res.json({ success: true, pages: pages });
        }
        else {
            res.json({ success: false, error: "You have not made any pages. Start today using the Create tab!" });
        }
    });
}
exports.getMyPages = getMyPages;
function deletePage(req, res) {
    exports.db.run("DELETE FROM Pages WHERE Id = ?", req.body.pageID, function (err) {
        if (err) {
            console.error("Error: " + err);
            res.json({ success: false, error: "Error" });
        }
        else {
            res.json({ success: true });
        }
    });
}
exports.deletePage = deletePage;
function updateViews(pageID, views) {
    exports.db.run("UPDATE Pages SET Views = ? WHERE Id = ?", views, pageID, function (err, row) { });
}
exports.updateViews = updateViews;
function getProfileIcon(req, res) {
    var userID = req.decoded['userID'];
    exports.db.get('SELECT Icon FROM UserAccounts WHERE Id = ?', userID, function (err, row) {
        if (err) {
            console.error('Error:', err);
            res.json({ success: false, error: "Error" });
        }
        else if (!row) {
            console.error('User does not exist');
            res.json({ success: false, error: "User does not exist" });
        }
        else {
            res.json({ success: true, icon: row.Icon });
        }
    });
}
exports.getProfileIcon = getProfileIcon;
function changeProfileIcon(req, res) {
    var userID = req.decoded['userID'];
    exports.db.run("UPDATE UserAccounts SET Icon = ? WHERE Id = ?", req.body.icon, userID, function (err, row) { });
    res.json({ success: true });
}
exports.changeProfileIcon = changeProfileIcon;
function saveCanvasImage(req, res) {
    var userID = req.decoded['userID'];
    // Check if there exists a canvas made by that user ID with a name given
    exports.db.get('SELECT * FROM Canvases WHERE Name = ? AND Creator = ?', req.body.name, userID, function (err, row) {
        // If no row, then there doesn't exist a canvas with that name, so insert a new one
        if (!row) {
            exports.db.run('INSERT INTO Canvases (Name, Dimensions, Shapes, Creator) VALUES (?,?,?,?)', [req.body.name,
                req.body.dimensions,
                req.body.shapes,
                userID,
            ], function (err) {
                if (err) {
                    console.error("Error: " + err);
                    res.json({ success: false, error: "Error" });
                }
                else {
                    res.json({ success: true });
                }
            });
        }
        else {
            // There already exists a canvas with this name, check with user they want to overwrite it
            res.json({ success: false, canvas_exists: true, error: "There already exists an image with that name. Overwrite?" });
        }
    });
}
exports.saveCanvasImage = saveCanvasImage;
function updateCanvasImage(req, res) {
    var userID = req.decoded['userID'];
    exports.db.run('UPDATE Canvases SET Dimensions = ?, Shapes = ? WHERE Name = ? AND Creator = ?', req.body.dimensions, req.body.shapes, req.body.name, userID, function (err) {
        if (err) {
            console.error("Error: " + err);
            res.json({ success: false, error: "Error" });
        }
        else {
            res.json({ success: true });
        }
    });
}
exports.updateCanvasImage = updateCanvasImage;
function getCanvasImage(req, res) {
    var userID = req.decoded['userID'];
    exports.db.get('SELECT * FROM Canvases WHERE Id = ? AND Creator = ?', req.body.canvasID, userID, function (err, row) {
        if (err) {
            console.error('Error:', err);
            res.json({ success: false, error: "Error" });
        }
        else if (!row) {
            console.error('Image does not exist');
            res.json({ success: false, error: "Image does not exist." });
        }
        else {
            res.json({ success: true, canvas: row });
        }
    });
}
exports.getCanvasImage = getCanvasImage;
function getMyCanvasImages(req, res) {
    var userID = req.decoded['userID'];
    var canvases = [];
    var canvasNumber = 0;
    exports.db.each('SELECT * FROM Canvases WHERE Creator = ?', userID, function (err, row) {
        if (err) {
            console.error('Error:', err);
            res.json({ success: false, error: "Error - please check your connection." });
        }
        else if (!row) {
            res.json({ success: false, error: "You have not made any images." });
        }
        else {
            canvases[canvasNumber] = row;
            canvasNumber++;
        }
    }, function (err, row) {
        if (canvasNumber > 0) {
            res.json({ success: true, canvases: canvases });
        }
        else {
            res.json({ success: false, error: "You have not made any images." });
        }
    });
}
exports.getMyCanvasImages = getMyCanvasImages;
function deleteCanvasImage(req, res) {
    exports.db.run("DELETE FROM Canvases WHERE Id = ?", req.body.canvasID, function (err) {
        if (err) {
            console.error("Error: " + err);
            res.json({ success: false, error: "Error" });
        }
        else {
            res.json({ success: true });
        }
    });
}
exports.deleteCanvasImage = deleteCanvasImage;
function getImagesFromIDs(res, html, ids, page, userID) {
    var query = userID ? 'Creator = ? AND ' : '';
    var args = userID ? [userID.toString()].concat(ids) : ids;
    exports.db.all('SELECT * ' +
        'FROM Canvases WHERE ' +
        query +
        'Id IN (' +
        ids.map(function () { return '?'; }).join(',') + ')', args, function (err, rows) {
        if (err) {
            console.error("Error: " + err);
            res.json({ success: false, error: "Error" });
        }
        else {
            if (page)
                res.json({ success: true,
                    htmlContent: html,
                    imageRows: rows, page: page });
            else
                res.json({ success: true, htmlContent: html, imageRows: rows });
        }
    });
}
exports.getImagesFromIDs = getImagesFromIDs;
function rateComment(req, res) {
    exports.db.run("UPDATE Comments SET Rating = ? WHERE CommentID = ?", req.body.rating, req.body.commentID, function (err) {
        if (err) {
            console.error("Error: " + err);
            res.json({ success: false, error: "Error" });
        }
        else {
            res.json({ success: true });
        }
    });
}
exports.rateComment = rateComment;
