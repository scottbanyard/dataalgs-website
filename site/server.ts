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
import { returnHTML }      from "./scripts/markdown";
import * as database       from "./scripts/database";

var app : express.Application = express();
var httpApp : express.Application = express();
configureHttpApplication( httpApp );
configureApplication( app );

export var sslOptions;

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
    database.attemptLogin(email,password,res);
  });

  // REGISTER
  router.post('/register', function(req : express.Request, res : express.Response) : void {
    var firstName : string = req.body.firstName;
    var lastName : string = req.body.lastName;
    database.createNewUser( firstName + " " + lastName,
                   req.body.email,
                   req.body.password,
                   res );
  });

  router.get('/getAllPublicPages', database.getAllPublicPages);


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
