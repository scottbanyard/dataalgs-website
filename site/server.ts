"use strict";
// set up ========================
import * as express from 'express';
import * as morgan  from 'morgan';
import * as bodyParser from 'body-parser';
import * as methodOverride from 'method-override';

var app : express.Application = express();
configureApplication( app );

function configureApplication( app : express.Application ) : void
{
    app.use(express.static(__dirname + '/dist/public'));

    // NB Only dev - logs to console
    app.use(morgan('dev'));

    app.use(bodyParser.urlencoded({'extended':false}));
    app.use(bodyParser.json({ type: 'application/json' } ));

    // Overrides DELETE and PUT
    app.use(methodOverride());

    // Need to setup API before we listen
    setupApi();

    // Start up
    app.listen(8080);
    console.log("App listening on port 8080");
}

function setupApi () : void {
  var router : express.Router = express.Router();
  // API always begins with localhost8080/api
  app.use('/api', router);

  // Make sure we don't stop at 1 route
  router.use(function(req, res, next) {
    next();
  });

  // -------------------- API --------------------

  // LOGIN
  router.post('/login', function(req, res) {
    var email : string = req.body.email;
    var password : string = req.body.password;
    // CHECK WITH DATABASE HERE USING LOGIN.TS
    var error : string = "error !!!!";
    var success : string = "0";
    // if successful, change success to "1", if not, leave it as it is and put the error in var error
    res.json({ success: success, error: error});
  });

  // REGISTER
  router.post('/register', function(req, res) {
    var name : string = req.body.firstName;
    var lastname : string = req.body.lastName;
    var email : string = req.body.email;
    var password : string = req.body.password;
    // REGISTER USER INTO DATABASE
    var error : string = "error !!!!";
    var success : string = "0";
    // if successful, change success to "1", if not, leave it as it is and put the error in var error
    res.json({ success: success, error: error});
  });

}
