import * as express        from 'express';
import * as sqlite3        from "sqlite3";
import * as csprng         from "csprng";
import { createHash }      from "crypto";
import { returnHTML }      from "./markdown";
import { sslOptions }      from "../server";
import { createToken }      from "./jwt-auth";


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

// Parses the given Markdown into HTML and returns this for Angular to place into a template
export function parseMarkdown(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
    var [thisHTML,ids] = returnHTML(req.body.content, false) ;
    getImagesFromIDs(res,thisHTML,ids, undefined, req.decoded['userID']);
}

// Converts date from number stored in database to local date
export function convertDate(date : number) : string {
  return new Date(date).toLocaleDateString();
}

// Hashes a password using the crypto node module
function hashPW( password : string, salt : string ) : string
{
    return createHash( 'sha256')
           .update( salt + password )
           .digest('hex');
}

// Attempts to login user by hashing entered password and checking if it matches the hashed original
// password stored in the database
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

// Creates new user by checking the e-mail isn't already existing in the database, and then creates the user
// if it isn't by inserting all the details entered
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

// Checks if user can change password by ensuring the entered current password is the same as the already stored
// hashed password by method of hashing entered password and comparing
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

// Updates database with new changed password for a certain user
function changePassword( userID : number, password : string, res : express.Response) : void {
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

// Checks if user can delete their account by comparing their entered password with the
// stored hashed password by method of hashing the entered password and comparing
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

// Deletes the account from the database for the certain user
function deleteAccount(userID : number, res : express.Response) : void {
  db.run("DELETE FROM UserAccounts WHERE Id = ?", userID, (err) => {
    if (err) {
      console.error("Error: " + err);
      res.json({ success: false, error: "Error"});
    } else {
      res.json({ success: true });
    }
  });
}

// Loads private page for user by first checking whether the Creator stored in the database is equal
// to the User ID stored in their token
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

// Saves content of entered Markdown by inserting into the database if the page ID isn't given. If the
// page ID is given, the database is updated with the new page values
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
           // Update existing row
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

// Inserts the entered comment into the database
export function makeComment(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  db.run('INSERT INTO Comments (UserID, Date, Title, Content, PageID, Name) VALUES (?,?,?,?,?,?)',
            [ req.decoded['userID']
            , req.body.time
            , req.body.comment.title
            , req.body.comment.body
            , req.body.pageID
            , req.decoded['name'] ]);
}

// Gets all of the User's comments corresponding to the User ID stored in the token given
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

// Deletes a certain comment from the database - you can only delete your own comments
export function deleteComment(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  var userID : number = req.decoded['userID'];
  db.run("DELETE FROM Comments WHERE CommentID = ? AND UserID = ?", req.body.commentID, userID, (err) => {
    if (err) {
      console.error("Error: " + err);
      res.json({ success: false, error: "Error"});
    } else {
      res.json({ success: true });
    }
  });
}

// Gets all public pages from the database and returns them
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

// Gets all of the User's pages using their User ID within the token given, and returns them
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

// Deletes a page from the database using the given page ID - you can only delete your own pages
export function deletePage(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  var userID : number = req.decoded['userID'];
  db.run("DELETE FROM Pages WHERE Id = ? AND Creator = ?", req.body.pageID, userID, (err) => {
    if (err) {
      console.error("Error: " + err);
      res.json({ success: false, error: "Error"});
    } else {
      res.json({ success: true });
    }
  });
}

// Updates views within the database for a certain page
export function updateViews(pageID : number, views : number) {
  db.run("UPDATE Pages SET Views = ? WHERE Id = ?", views, pageID, (err,row) => {});
}

// Gets profile icon from database using the User ID within the token given and returns it
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

// Changes profile icon by updating the database with the new icon according to the User ID within the token given
export function changeProfileIcon( req: express.Request & { decoded : DecodedToken }, res : express.Response):void
{
  var userID : number = req.decoded['userID'];
  db.run("UPDATE UserAccounts SET Icon = ? WHERE Id = ?", req.body.icon, userID, (err,row) => {});
  res.json({success: true });
}

// Saves image on canvas by first checking if it exists - and if it does then it updates the database with the new
// canvas properties. If it doesn't, then it inserts the new canvas into the database
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

// Updates the canvas image in the database - can only update your own image
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

// Gets the canvas image requested from the database using canvas ID and returns it - can only get your own canvases
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

// Gets all of your canvas images from the database using your User ID within the token given and returns them
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

// Deletes the canvas image from the database using the canvas ID - can only delete your own canvas image
export function deleteCanvasImage(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  var userID : number = req.decoded['userID'];
  db.run("DELETE FROM Canvases WHERE Id = ? AND Creator = ?", req.body.canvasID, userID, (err) => {
    if (err) {
      console.error("Error: " + err);
      res.json({ success: false, error: "Error"});
    } else {
      res.json({ success: true });
    }
  });
}

// Gets canvas images using IDs found in Markdown
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

// Updates rating in the database for certain comment using comment ID
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
