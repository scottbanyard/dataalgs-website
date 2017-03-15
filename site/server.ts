"use strict";
// set up ========================
import * as express from 'express';
import * as morgan  from 'morgan';
import * as bodyParser from 'body-parser';
import * as methodOverride from 'method-override';

function configureApplication( app : express.Application ) : void
{
    app.use(express.static(__dirname + '/dist/public'));

    // NB Only dev - logs to console
    app.use(morgan('dev'));

    app.use(bodyParser.urlencoded({'extended':true}));
    app.use(bodyParser.json());

    // Overrides DELETE and PUT
    app.use(methodOverride());

    // Start up
    app.listen(8080);
    console.log("App listening on port 8080");
}

var app : express.Application = express();
configureApplication( app );
