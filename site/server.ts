"use strict";
// set up ========================
import * as express        from 'express';
import * as morgan         from 'morgan';
import * as bodyParser     from 'body-parser';
import * as methodOverride from 'method-override';
import * as fs             from "fs";
import * as https          from "https";
import * as http           from "http";
import * as helmet         from "helmet";
import * as sqlite3        from "sqlite3";
import * as csprng         from "csprng";
import { createHash }      from "crypto";
import * as jwt            from "jsonwebtoken";
import { returnHTML }      from "./scripts/markdown";

var db = new sqlite3.Database('database.sqlite');
var app : express.Application = express();
var httpApp : express.Application = express();
configureHttpApplication( httpApp );
configureApplication( app );

var sslOptions;

// Own type for decoded token
export interface DecodedToken {
    decoded : any
}

interface Page {
    Title:string;
    Content: string;
    PrivateView : number;
    Creator: number;
    PrivateEdit: number;
    LastEdit: number;
    Views: number;
}
// http app used to redirect user to https express app
function configureHttpApplication ( httpApp : express.Application ) : void
{
    httpApp.set('port', process.env.PORT || 8070);
    httpApp.use(helmet())
    httpApp.get("*", function (req, res, next) {
    res.redirect("https://localhost:8080" + req.path);
    });
    http.createServer(httpApp).listen(httpApp.get('port'), function() {
        console.log('Express HTTP server listening on port ' +
                        httpApp.get('port'));
    });
}

function configureApplication( app : express.Application ) : void
{
    app.set('port', process.env.PORT || 8080);
    var banned : string[] = [];
    banUpperCase("./dist/public/", "");

    app.use(helmet())
    app.use(lower);
    app.use(ban)

  // Make the URL lower case.
    function lower(req, res, next) : void {
        req.url = req.url.toLowerCase();
        next();
    }

  // Forbid access to the URLs in the banned list.
    function ban(req, res, next) : void {
        for (var i=0; i<banned.length; i++) {
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
    cert: fs.readFileSync('ssl/server.crt'),
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
      for (var i=0; i<names.length; i++) {
          var name = names[i];
          var file = folder + "/" + name;
          if (name != name.toLowerCase()) banned.push(file.toLowerCase());
          var mode = fs.statSync(root + file).mode;
          if ((mode & folderBit) == 0) continue;
          banUpperCase(root, file);
      }
  }

  // Called by express.static.  Deliver response as XHTML.
  function deliverXHTML(res, path, stat) : void {
      if (path.endsWith(".html")) {
          res.header("Content-Type", "application/xhtml+xml");
      }
  }
  var options = { setHeaders: deliverXHTML };
  app.use(express.static(__dirname + '/dist/public', options));

  // NB Only dev - logs to console
  app.use(morgan('dev'));

  // Allows API calls to parse JSON
  app.use(bodyParser.urlencoded({'extended':false}));
  app.use(bodyParser.json({ type: 'application/json' } ));

  // Overrides DELETE and PUT
  app.use(methodOverride());

  // Need to setup API before we listen
  setupApi();

  // Start up secure HTTPS server
  var server = https.createServer(sslOptions, app).listen(app.get('port'), () =>
      console.log("Express HTTPS server listening on port " + app.get('port'))
  );
}

function setupApi () : void {
  var router : express.Router = express.Router();

  // Make sure we don't stop at 1 route
  router.use(function(req : express.Request, res : express.Response, next : express.NextFunction) {
    next();
  });

  // -------------------- API --------------------

  // UNPROTECTED ROUTES (NO TOKEN NEEDED)
  // LOGIN
  router.post('/login', function(req : express.Request, res : express.Response) : void {
    var email : string = req.body.email;
    var password : string = req.body.password;
    // CHECK WITH DATABASE HERE USING LOGIN.TS
    attemptLogin(email,password,res);
  });

  // REGISTER
  router.post('/register', function(req : express.Request, res : express.Response) : void {
    var firstName : string = req.body.firstName;
    var lastName : string = req.body.lastName;
    createNewUser( firstName + " " + lastName,
                   req.body.email,
                   req.body.password,
                   res );
  });

  router.get('/getAllPublicPages', getAllPublicPages);

  router.post('/previewHTML', parseMarkdown);

  router.post('/allComments', function(req, res) : void {
    var pageID : number = req.body.pageID;
    db.all( 'SELECT * FROM Comments WHERE PageID = ?', pageID,
            (err,rows) => {
                 if (err){
                     console.error('Error:', err);
                     res.json({ success: false });
                 }
                 else if (!rows){
                     res.json({ success: false });
                 }
                 else{
                     // Convert each date to local readable date
                     for (var i = 0; i < rows.length; i++) {
                       rows[i].Date = convertDate(rows[i].Date);
                     }
                     res.json({ success: true, rows: rows });
                 }
      });
  });

  router.post('/loadPage', (req : express.Request & { decoded : DecodedToken, page? : Page  }, res : express.Response, next : express.NextFunction) =>
  {
      db.get('SELECT * FROM Pages WHERE Id = ?', req.body.pageID, (err,row) => {
          if (err){
              console.error('Error:', err);
              res.json({ success: false });
          }
          else if (!row){
              res.json({ success: false });
              console.error('Page', req.body.pageID, 'doesn\'t exist!');
          }
          else{
             // Need to be logged in to view
             if(row.PrivateView == 1){
                 req.page = <Page>row;
                 next();
             }
             else{
                row.Views = row.Views + 1;
                updateViews(req.body.pageID, row.Views);
                res.json({ success: true,
                          htmlContent:returnHTML(row.Content),
                          page:row});
             }
          }
      });
  });

  // TOKENS NEEDED TO ACCESS REST OF API
  router.use(checkLoggedIn);

  // PROTECTED ROUTES (TOKEN NEEDED)
  router.post('/loadPage', loadPrivatePage);

  router.post('/makeComment', makeComment);

  router.post('/savePage', saveContent);

  router.post('/changepw', attemptChangePassword);

  router.post('/deleteaccount', attemptDeleteAccount);

  router.post('/mycomments', getMyComments);

  router.post('/deletecomment', deleteComment);

  router.post('/mypages', getMyPages);

  router.post('/deletepage', deletePage);

  router.post('/geticon', getProfileIcon);

  router.post('/changeicon', changeProfileIcon);

  router.post('/saveimage', saveCanvasImage);

  router.post('/getimage', getCanvasImage);

  router.post('/getallimages', getMyCanvasImages);

  router.post('/updateimage', updateCanvasImage);

  router.post('/deleteimage', deleteCanvasImage);


  // API always begins with localhost8080/api
  app.use('/api', router);
}

function createToken( id : number, name : string, res : express.Response )
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

function parseMarkdown(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  res.json({ success: true, html: returnHTML(req.body.content) });
}

// Converts date from number stored in database to local date
function convertDate(date : number) : string {
  return new Date(date).toLocaleDateString();
}

// Database specifics
// Hashes a password
function hashPW( password : string, salt : string ) : string
{
    return createHash( 'sha256')
           .update( salt + password )
           .digest('hex');
}

function attemptLogin( email : string,
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

function createNewUser( name : string,
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

function attemptChangePassword(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
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

function attemptDeleteAccount(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
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

function checkLoggedIn(req : express.Request & { decoded : DecodedToken, page? : Page }, res : express.Response, next : Function) {
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

function loadPrivatePage(req: express.Request & { decoded : DecodedToken, page : Page }, res : express.Response ) : void {
  var userID : number = req.decoded['userID'];
  var pageCreator : number = req.page.Creator;
  if (pageCreator == userID) {
    req.page.Views = req.page.Views + 1;
    updateViews(req.body.pageID, req.page.Views);
    res.json({ success: true,
               htmlContent:returnHTML(req.page.Content),
               page: req.page
           });
  } else {
    res.json({ success: false,
               error: "Not authorised - don't own the private page."
           });
  }
}

function saveContent( req: express.Request & { decoded : DecodedToken }, res : express.Response):void
{
    var userID : number = req.decoded['userID'];
    console.log(userID);
    db.get('SELECT * FROM Pages WHERE Id = ?', req.body.pageID, (err,row) => {
        if (err){
            console.error('Error:', err);
            res.json({ success: false });
        }
        else if (!row){
            // Insert new row with 0 views
            db.run('INSERT INTO Pages (Title, Content, PrivateView, Creator, PrivateEdit, LastEdit, Views) VALUES (?,?,?,?,?,?,?)',
                [ req.body.Title,
                  req.body.Content,
                  req.body.PrivateView,
                  userID,
                  req.body.PrivateEdit,
                  req.body.LastEdit,
                  0 ]);

            res.json({ success: true });
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

function makeComment(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  db.run('INSERT INTO Comments (UserID, Date, Title, Content, PageID, Name) VALUES (?,?,?,?,?,?)',
            [ req.decoded['userID']
            , req.body.time
            , req.body.comment.title
            , req.body.comment.body
            , req.body.pageID
            , req.decoded['name'] ]);
}

function getMyComments(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
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

function deleteComment(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  db.run("DELETE FROM Comments WHERE CommentID = ?", req.body.commentID, (err) => {
    if (err) {
      console.error("Error: " + err);
      res.json({ success: false, error: "Error"});
    } else {
      res.json({ success: true });
    }
  });
}

function getAllPublicPages(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
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

function getMyPages(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
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

function deletePage(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  db.run("DELETE FROM Pages WHERE Id = ?", req.body.pageID, (err) => {
    if (err) {
      console.error("Error: " + err);
      res.json({ success: false, error: "Error"});
    } else {
      res.json({ success: true });
    }
  });
}

function updateViews(pageID : number, views : number) {
  db.run("UPDATE Pages SET Views = ? WHERE Id = ?", views, pageID, (err,row) => {});
}

function getProfileIcon( req: express.Request & { decoded : DecodedToken }, res : express.Response):void
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

function changeProfileIcon( req: express.Request & { decoded : DecodedToken }, res : express.Response):void
{
  var userID : number = req.decoded['userID'];
  db.run("UPDATE UserAccounts SET Icon = ? WHERE Id = ?", req.body.icon, userID, (err,row) => {});
  res.json({success: true });
}

function saveCanvasImage(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
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

function updateCanvasImage(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
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

function getCanvasImage(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  var userID : number = req.decoded['userID'];
  db.get('SELECT * FROM Canvases WHERE Id = ?', req.body.canvasID, (err,row) => {
    if (err){
        console.error('Error:', err);
        res.json({ success: false, error: "Error"});
    }
    else if (!row){
        console.error('Image does not exist');
        res.json({ success: false, error: "Image does not exist"});
    }
    else {
        res.json({ success: true, canvas: row});
    }
  });
}

function getMyCanvasImages(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
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
      console.log(canvasNumber);
      res.json({ success: true, canvases: canvases });
    } else {
      res.json({ success: false, error: "You have not made any images."});
    }
  });
}

function deleteCanvasImage(req : express.Request & { decoded : DecodedToken }, res : express.Response) : void {
  db.run("DELETE FROM Canvases WHERE Id = ?", req.body.canvasID, (err) => {
    if (err) {
      console.error("Error: " + err);
      res.json({ success: false, error: "Error"});
    } else {
      res.json({ success: true });
    }
  });
}
