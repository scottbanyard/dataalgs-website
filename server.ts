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
import * as database                    from "./scripts/database";
import { createToken, checkLoggedIn }   from "./scripts/jwt-auth";
import { setupAPI }                     from "./scripts/api";

export var app : express.Application = express();
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
  setupAPI();

  // Start up secure HTTPS server
  var server = https.createServer(sslOptions, app).listen(app.get('port'), () =>
      console.log("Express HTTPS server listening on port " + app.get('port'))
  );
}
