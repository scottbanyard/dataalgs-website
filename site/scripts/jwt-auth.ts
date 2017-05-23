import * as jwt            from "jsonwebtoken";
import * as express        from 'express';
import { sslOptions }      from "../server";
import { DecodedToken, Page } from "./database";

// The JSON Web Token node module verifies the passed in token using our SSL certificate that has encrypted it.
export function checkLoggedIn(req : express.Request & { decoded : DecodedToken, page? : Page }, res : express.Response, next : Function) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  // Decode token if provided.
  if (token) {
    jwt.verify(token, sslOptions.cert, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) {
          return res.json({ success: false,
                            message: "Failed to authenticate token." });
      } else {
          req.decoded = decoded;
          // Token verified and therefore user is logged in. Pass onto next route.
          next();
      }
    });
  } else {
    // No token provided.
    return res.status(403).send({success: false, message: "No token provided."});
  }
}

// Create a token using the JSON Web Token node module and encrypt it using our SSL key to prevent tampering client-side.
// Include the User's ID and name inside the token for use when creating pages etc. - can access their ID easily.
export function createToken( id : number, name : string, res : express.Response )
{
  jwt.sign( { userID: id, name : name }
            , sslOptions.key
            , { algorithm: 'RS256', expiresIn: "10h" }
            , (err, token) => {
              if (err) {
                console.error("Error creating token: " + err);
              } else {
                res.json({ success: true, token: token });
              }
            });
}
