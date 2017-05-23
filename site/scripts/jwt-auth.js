"use strict";
exports.__esModule = true;
var jwt = require("jsonwebtoken");
var server_1 = require("../server");
// The JSON Web Token node module verifies the passed in token using our SSL certificate that has encrypted it.
function checkLoggedIn(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // Decode token if provided.
    if (token) {
        jwt.verify(token, server_1.sslOptions.cert, { algorithms: ['RS256'] }, function (err, decoded) {
            if (err) {
                return res.json({ success: false,
                    message: "Failed to authenticate token." });
            }
            else {
                req.decoded = decoded;
                // Token verified and therefore user is logged in. Pass onto next route.
                next();
            }
        });
    }
    else {
        // No token provided.
        return res.status(403).send({ success: false, message: "No token provided." });
    }
}
exports.checkLoggedIn = checkLoggedIn;
// Create a token using the JSON Web Token node module and encrypt it using our SSL key to prevent tampering client-side.
// Include the User's ID and name inside the token for use when creating pages etc. - can access their ID easily.
function createToken(id, name, res) {
    jwt.sign({ userID: id, name: name }, server_1.sslOptions.key, { algorithm: 'RS256', expiresIn: "10h" }, function (err, token) {
        if (err) {
            console.error("Error creating token: " + err);
        }
        else {
            res.json({ success: true, token: token });
        }
    });
}
exports.createToken = createToken;
