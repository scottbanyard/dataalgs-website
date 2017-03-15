"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
function configureApplication(app) {
    app.use(express.static(__dirname + '/dist/public'));
    app.use(morgan('dev'));
    app.use(bodyParser.urlencoded({ 'extended': true }));
    app.use(bodyParser.json());
    app.use(methodOverride());
    app.listen(8080);
    console.log("App listening on port 8080");
}
var app = express();
configureApplication(app);
