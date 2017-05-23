"use strict";
// set up ========================
import * as express                     from 'express';
import * as morgan                      from 'morgan';
import * as bodyParser                  from 'body-parser';
import * as methodOverride              from 'method-override';
import * as fs                          from "fs";
import * as https                       from "https";
import * as http                        from "http";
import * as helmet                      from "helmet";
import { returnHTML }                   from "./scripts/markdown";
import * as database                    from "./scripts/database";
import { createToken, checkLoggedIn }   from "./scripts/jwt-auth";

var app : express.Application = express();
var httpApp : express.Application = express();
configureHttpApplication( httpApp );
configureApplication( app );

export var sslOptions;

// HTTP Express application used to redirect user to HTTPS Express application
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

// HTTPS Express application
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

  // Need to setup API before we start listening
  setupApi();

  // Start up secure HTTPS server
  var server = https.createServer(sslOptions, app).listen(app.get('port'), () =>
      console.log("Express HTTPS server listening on port " + app.get('port'))
  );
}

// All methods within this function uses the Express Router to configure and start our own API
function setupApi () : void {
  // Create our new API router
  var router : express.Router = express.Router();

  // Make sure we don't stop at 1 route, go to the next
  router.use(function(req : express.Request, res : express.Response, next : express.NextFunction) {
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
  router.post('/login', function(req : express.Request, res : express.Response) : void {
    var email : string = req.body.email;
    var password : string = req.body.password;
    database.attemptLogin(email,password,res);
  });

  /*
    URL - https://localhost:8080/api/register
    Method - POST
    Data Params - {firstname, lastname, email, password}
    Success Response - Code 200, Content {success: true}
    Error Response -  Code 200, Content {success: false, error: message}
  */
  router.post('/register', function(req : express.Request, res : express.Response) : void {
    var firstName : string = req.body.firstName;
    var lastName : string = req.body.lastName;
    database.createNewUser( firstName + " " + lastName,
                   req.body.email,
                   req.body.password,
                   res );
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
  router.post('/allComments', function(req, res) : void {
    var pageID : number = req.body.pageID;
     database.db.all('SELECT UserAccounts.Icon, Comments.* FROM Comments INNER JOIN UserAccounts ON UserAccounts.Id = Comments.UserID WHERE Comments.PageID = ?', pageID,
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
                     for (var i : number = 0; i < rows.length; i++) {
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
  router.post('/loadPage', (req : express.Request & { decoded : database.DecodedToken, page? : database.Page  }, res : express.Response, next : express.NextFunction) =>
  {
      database.db.get('SELECT * FROM Pages WHERE Id = ?', req.body.pageID, (err,row) => {
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
                 req.page = <database.Page>row;
                 next();
             }
             else{
                row.Views = row.Views + 1;
                database.updateViews(req.body.pageID, row.Views);
                var [html,ids] = returnHTML(row.Content,true);
                database.getImagesFromIDs(res,html,ids,row);
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
  router.use(checkLoggedIn);

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
  app.use('/api', router);
}
