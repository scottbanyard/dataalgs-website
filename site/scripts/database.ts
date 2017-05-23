import * as express        from 'express';
import * as sqlite3        from "sqlite3";
import * as csprng         from "csprng";
import { createHash }      from "crypto";
import * as jwt            from "jsonwebtoken";
import { returnHTML }      from "./markdown";
import { sslOptions }      from "../server";

// Creates the embedded database using SQLite3
export var db = new sqlite3.Database('database.sqlite');

// Own type for decoded token
export interface DecodedToken {
    decoded : any
}

// Own type for a Page
export interface Page {
    Title:string;
    Content: string;
    PrivateView : number;
    Creator: number;
    PrivateEdit: number;
    LastEdit: number;
    Views: number;
}

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

export function parseMarkdown(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
    var [thisHTML,ids] = returnHTML(req.body.content, false) ;
    getImagesFromIDs(res,thisHTML,ids, undefined, req.decoded['userID']);
}

// Converts date from number stored in database to local date
export function convertDate(date : number) : string {
  return new Date(date).toLocaleDateString();
}

// Database specifics
// Hashes a password
export function hashPW( password : string, salt : string ) : string
{
    return createHash( 'sha256')
           .update( salt + password )
           .digest('hex');
}

export function attemptLogin( email : string,
                       password : string,
                       res : express.Response )
{
    db.get('SELECT PassSalt, PassHash, Id, Name FROM UserAccounts WHERE Email = ?', email, (err,row) => {
        if (err){
            console.error('Error:', err);
            res.json({ success: false, error: "Error"});
        }
        else if (!row){
            console.error('User does not exist');
            res.json({ success: false, error: "User does not exist"});
        }
        else if ( hashPW( password, row.PassSalt ) == row.PassHash) {
            createToken(row.Id, row.Name, res);
        } else if ( hashPW( password, row.PassSalt ) != row.PassHash) {
            console.log('Password incorrect');
            res.json({ success: false, error: "Password is incorrect. Please try again." });
        }
    });
}

export function createNewUser( name : string,
                        email : string,
                        password : string,
                        res : express.Response)
{
    db.get( 'SELECT * FROM UserAccounts WHERE Email = ?', email,
            (err,row) => {
        if (err){
            console.error('Error:', err);
            res.json({ success: false, error: "Error"});
        }
        else if(row){
            console.warn('That email:',email,'already exists in our system');
            res.json({ success: false,
                       error: "Email already exists in our system"});
        }
        else{
            const salt = csprng();
            db.run('INSERT INTO UserAccounts (Name, Email, PassSalt, PassHash, Icon) VALUES (?,?,?,?,?)', [name, email, salt, hashPW(password,salt), "man.svg"]);
            console.log('Account for',email,'successfully created');
            res.json({ success: true });

        }
    });
}

export function attemptChangePassword(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  var userID : number = req.decoded['userID'];
  db.get('SELECT PassSalt, PassHash, Email FROM UserAccounts WHERE Id = ?', userID, (err,row) => {
    if (err){
        console.error('Error:', err);
        res.json({ success: false, error: "Error"});
    }
    else if (!row){
        console.error('User does not exist');
        res.json({ success: false, error: "User does not exist"});
    }
    else if (hashPW(req.body.user.currentPassword, row.PassSalt) != row.PassHash) {
        res.json({ success: false, error: "Incorrect current password!"})
    }
    else if (hashPW(req.body.user.currentPassword, row.PassSalt) == row.PassHash) {
        changePassword(userID, req.body.user.newPassword, res);
    }
  });
}

export function changePassword( userID : number, password : string, res : express.Response) : void {
    const salt = csprng();
    db.run("UPDATE UserAccounts SET PassSalt = ?, PassHash = ? WHERE Id = ?", salt, hashPW(password,salt), userID, (err,row) => {
      if (err) {
        console.log(err);
        res.json({ success: false, error: "Error in database." });
      } else {
        res.json({ success: true });
      }
    });
}

export function attemptDeleteAccount(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  var userID : number = req.decoded['userID'];
  db.get('SELECT PassSalt, PassHash, Email FROM UserAccounts WHERE Id = ?', userID, (err,row) => {
    if (err){
        console.error('Error:', err);
        res.json({ success: false, error: "Error"});
    }
    else if (!row){
        console.error('User does not exist');
        res.json({ success: false, error: "User does not exist"});
    }
    else if (hashPW(req.body.user.currentPassword, row.PassSalt) != row.PassHash) {
        res.json({ success: false, error: "Incorrect current password!"})
    }
    else if (hashPW(req.body.user.currentPassword, row.PassSalt) == row.PassHash) {
        deleteAccount(userID, res);
    }
  });
}

export function deleteAccount(userID : number, res : express.Response) : void {
  db.run("DELETE FROM UserAccounts WHERE Id = ?", userID, (err) => {
    if (err) {
      console.error("Error: " + err);
      res.json({ success: false, error: "Error"});
    } else {
      res.json({ success: true });
    }
  });
}

export function checkLoggedIn(req : express.Request & { decoded : DecodedToken, page? : Page }, res : express.Response, next : Function) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  // decode token
  if (token) {
    jwt.verify(token, sslOptions.cert, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) {
          return res.json({ success: false,
                            message: "Failed to authenticate token." });
      } else {
          req.decoded = decoded;
          next();
      }
    });
  } else {
    // no token provided
    return res.status(403).send({success: false, message: "No token provided."});
  }
}

export function loadPrivatePage(req: express.Request & { decoded : DecodedToken, page : Page }, res : express.Response ) : void {
  var userID : number = req.decoded['userID'];
  var pageCreator : number = req.page.Creator;
  if (pageCreator == userID) {
    req.page.Views = req.page.Views + 1;
    updateViews(req.body.pageID, req.page.Views);
    var [thisHTML,ids] = returnHTML(req.page.Content, true)
    getImagesFromIDs(res,thisHTML,ids,req.page,userID);
  } else {
    res.json({ success: false,
               error: "Not authorised - don't own the private page."
           });
  }
}

export function saveContent( req: express.Request & { decoded : DecodedToken }, res : express.Response):void
{
    var userID : number = req.decoded['userID'];
    db.get('SELECT * FROM Pages WHERE Id = ?', req.body.pageID, (err,row) => {
        if (err){
            console.error('Error:', err);
            res.json({ success: false });
        }
        else if (!row){
            // Serially execute two queries
            db.serialize( function() {
              // Insert new row with 0 views
              db.run('INSERT INTO Pages (Title, Content, PrivateView, Creator, PrivateEdit, LastEdit, Views) VALUES (?,?,?,?,?,?,?)',
                  [ req.body.Title,
                    req.body.Content,
                    req.body.PrivateView,
                    userID,
                    req.body.PrivateEdit,
                    req.body.LastEdit,
                    0 ]);
              // Get auto incremented value generated in table for that inserted page, and return it
              db.get('SELECT Id FROM Pages WHERE LastEdit = ? AND Creator = ?', req.body.LastEdit, userID, (err, row) => {
                res.json({ success: true, id: row.Id });
              });

            });
        }
        else{
           // update existing row
           db.run("UPDATE Pages SET Title = ?, Content = ?, PrivateView = ?, PrivateEdit = ?, LastEdit = ?, Views = ? WHERE Id = ?",
             req.body.Title,
             req.body.Content,
             req.body.PrivateView,
             req.body.PrivateEdit,
             req.body.LastEdit, req.body.Views + 1, req.body.pageID );
             res.json({ success: true });
        }
    });
}

export function makeComment(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  db.run('INSERT INTO Comments (UserID, Date, Title, Content, PageID, Name) VALUES (?,?,?,?,?,?)',
            [ req.decoded['userID']
            , req.body.time
            , req.body.comment.title
            , req.body.comment.body
            , req.body.pageID
            , req.decoded['name'] ]);
}

export function getMyComments(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  var userID : number = req.decoded['userID'];
  var comments : object[] = [];
  var commentNumber : number = 0;
  db.each('SELECT * FROM Comments WHERE UserId = ?', userID, (err,row) => {
    if (err){
        console.error('Error:', err);
        res.json({ success: false, error: "Error - please check your connection."});
    }
    else if (!row){
        console.error('User does not exist');
        res.json({ success: false, error: "You have not made any comments. Start today!"});
    } else {
        row.Date = convertDate(row.Date);
        comments[commentNumber] = row;
        commentNumber++;
    }
  }, (err, row) => {
    if (commentNumber > 0) {
      res.json({ success: true, comments: comments });
    } else {
      res.json({ success: false, error: "You have not made any comments. Start today!"});
    }
  });
}

export function deleteComment(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  db.run("DELETE FROM Comments WHERE CommentID = ?", req.body.commentID, (err) => {
    if (err) {
      console.error("Error: " + err);
      res.json({ success: false, error: "Error"});
    } else {
      res.json({ success: true });
    }
  });
}

export function getAllPublicPages(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  db.all("SELECT Id, Title, Creator, LastEdit, Views FROM Pages WHERE PrivateView = 0", function(err, rows) {
      if (err) {
        res.json({ success: false, error: "Error"});
      } else if (!rows) {
        res.json({ success: false, error: "There are no public pages currently!"});
      } else {
        rows.forEach(function (row) {
          row.LastEdit = convertDate(row.LastEdit);
        });
        res.json({ success: true, pages: rows });
      }
  });
}

export function getMyPages(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  var userID : number = req.decoded['userID'];
  var pages : object[] = [];
  var pageNumber : number = 0;
  db.each('SELECT * FROM Pages WHERE Creator = ?', userID, (err,row) => {
    if (err){
        console.error('Error:', err);
        res.json({ success: false, error: "Error - please check your connection."});
    }
    else if (!row){
        res.json({ success: false, error: "You have not made any pages. Start today using the Create tab!"});
    } else {
        row.LastEdit = convertDate(row.LastEdit);
        pages[pageNumber] = row;
        pageNumber++;
    }
  }, (err, row) => {
    if (pageNumber > 0) {
      res.json({ success: true, pages: pages });
    } else {
      res.json({ success: false, error: "You have not made any pages. Start today using the Create tab!"});
    }
  });
}

export function deletePage(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  db.run("DELETE FROM Pages WHERE Id = ?", req.body.pageID, (err) => {
    if (err) {
      console.error("Error: " + err);
      res.json({ success: false, error: "Error"});
    } else {
      res.json({ success: true });
    }
  });
}

export function updateViews(pageID : number, views : number) {
  db.run("UPDATE Pages SET Views = ? WHERE Id = ?", views, pageID, (err,row) => {});
}

export function getProfileIcon( req: express.Request & { decoded : DecodedToken }, res : express.Response):void
{
  var userID : number = req.decoded['userID'];
  db.get('SELECT Icon FROM UserAccounts WHERE Id = ?', userID, (err,row) => {
    if (err){
        console.error('Error:', err);
        res.json({ success: false, error: "Error"});
    }
    else if (!row){
        console.error('User does not exist');
        res.json({ success: false, error: "User does not exist"});
    }
    else {
        res.json({ success: true, icon: row.Icon});
    }
  });
}

export function changeProfileIcon( req: express.Request & { decoded : DecodedToken }, res : express.Response):void
{
  var userID : number = req.decoded['userID'];
  db.run("UPDATE UserAccounts SET Icon = ? WHERE Id = ?", req.body.icon, userID, (err,row) => {});
  res.json({success: true });
}

export function saveCanvasImage(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  var userID : number = req.decoded['userID'];

  // Check if there exists a canvas made by that user ID with a name given
  db.get('SELECT * FROM Canvases WHERE Name = ? AND Creator = ?', req.body.name, userID, (err,row) => {
    // If no row, then there doesn't exist a canvas with that name, so insert a new one
    if (!row) {
      db.run('INSERT INTO Canvases (Name, Dimensions, Shapes, Creator) VALUES (?,?,?,?)',
          [ req.body.name,
            req.body.dimensions,
            req.body.shapes,
            userID,
          ], (err) => {
            if (err) {
              console.error("Error: " + err);
              res.json({ success: false, error: "Error"});
            } else {
              res.json({ success: true });
            }
          });
    } else {
      // There already exists a canvas with this name, check with user they want to overwrite it
      res.json({success: false, canvas_exists: true, error: "There already exists an image with that name. Overwrite?"});
    }
  });

}

export function updateCanvasImage(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  var userID : number = req.decoded['userID'];

  db.run('UPDATE Canvases SET Dimensions = ?, Shapes = ? WHERE Name = ? AND Creator = ?', req.body.dimensions, req.body.shapes, req.body.name, userID, (err) => {
        if (err) {
          console.error("Error: " + err);
          res.json({ success: false, error: "Error"});
        } else {
          res.json({ success: true });
        }
      });

}

export function getCanvasImage(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  var userID : number = req.decoded['userID'];
  db.get('SELECT * FROM Canvases WHERE Id = ? AND Creator = ?', req.body.canvasID, userID, (err,row) => {
    if (err){
        console.error('Error:', err);
        res.json({ success: false, error: "Error"});
    }
    else if (!row){
        console.error('Image does not exist');
        res.json({ success: false, error: "Image does not exist."});
    }
    else {
        res.json({ success: true, canvas: row});
    }
  });
}

export function getMyCanvasImages(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  var userID : number = req.decoded['userID'];
  var canvases : object[] = [];
  var canvasNumber : number = 0;
  db.each('SELECT * FROM Canvases WHERE Creator = ?', userID, (err,row) => {
    if (err){
        console.error('Error:', err);
        res.json({ success: false, error: "Error - please check your connection."});
    }
    else if (!row){
        res.json({ success: false, error: "You have not made any images."});
    } else {
        canvases[canvasNumber] = row;
        canvasNumber++;
    }
  }, (err, row) => {
    if (canvasNumber > 0) {
      res.json({ success: true, canvases: canvases });
    } else {
      res.json({ success: false, error: "You have not made any images."});
    }
  });
}

export function deleteCanvasImage(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  db.run("DELETE FROM Canvases WHERE Id = ?", req.body.canvasID, (err) => {
    if (err) {
      console.error("Error: " + err);
      res.json({ success: false, error: "Error"});
    } else {
      res.json({ success: true });
    }
  });
}

export function getImagesFromIDs(
    res : express.Response, html:string, ids:string[], page?:Page, userID ?: number) : void
{
    var query = userID ?  'Creator = ? AND ' : '';
    var args  = userID ? [userID.toString()].concat(ids) : ids;
    db.all('SELECT * '+
            'FROM Canvases WHERE '+
            query +
            'Id IN (' +
            ids.map(() => '?').join(',') + ')',
            args, (err,rows) =>
            {
                if (err) {
                    console.error("Error: " + err);
                    res.json({ success: false, error: "Error"});
                } else {
                    if(page)
                        res.json({ success: true,
                                    htmlContent : html,
                                    imageRows:rows, page:page });
                    else
                        res.json({ success: true, htmlContent : html, imageRows:rows });
                }
            });
}

export function rateComment(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  db.run("UPDATE Comments SET Rating = ? WHERE CommentID = ?", req.body.rating, req.body.commentID, (err) => {
    if (err) {
      console.error("Error: " + err);
      res.json({ success: false, error: "Error"});
    } else {
      res.json({ success: true });
    }
  });
}
