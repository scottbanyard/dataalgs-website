"use strict";
// Run a node.js web server for local development of a static web site.
// Start with "node server.js" and put pages in a "public" sub-folder.
// Visit the site at the address printed on the console.

// The server is configured to be platform independent.  URLs are made lower
// case, so the server is case insensitive even on Linux, and paths containing
// upper case letters are banned so that the file system is treated as case
// sensitive even on Windows.

// Load the library modules, and define the global constants.
// See http://en.wikipedia.org/wiki/List_of_HTTP_status_codes.
// Start the server: change the port to the default 80, if there are no
// privilege issues and port number 80 isn't already in use.

// import { lookup } from "mime-types.js";
// import { createServer } from "http";
// import * as fs from "fs";
var DEBUG = false;
import http = require("http");
import fs   = require("fs");
import mime = require("mime-types");
var OK   = 200, NotFound = 404, BadType = 415, Error = 500;
var banned;
start(8080);

// Start the http service.  Accept only requests from localhost, for security.
function start(port) {
    banned = [];
    banUpperCase("./public/", "");
    var service = http.createServer(handle);
    service.listen(port, "localhost");
    var address = "http://localhost";
    if (port != 80)
        address = address + ":" + port;
    console.log("Server running at", address);
}

// Serve a request by delivering a file.
function handle(request, response) {
    console.log(request.url);
    var url = request.url.toLowerCase();
    if (url.endsWith("/"))
        url = url + "index.xhtml";

    var type : string | boolean = findType(url);
    if (type == null)
        return fail(response, BadType, "File type unsupported");
    url = changeURLOnType( url, type );
    if (isBanned(url))
        return fail(response, NotFound, "URL has been banned");

    fs.readFile(url, function (err, content) {
        deliver(response, type, err, content);
    });
}

// Forbid any resources which shouldn't be delivered to the browser.
function isBanned(url) {
    for (var i=0; i<banned.length; i++) {
        var b = banned[i];
        if (url.startsWith(b)) return true;
    }
    return false;
}

// Find the content type to respond with, or undefined.
function findType(url : string ) {
    var dot = url.lastIndexOf(".");
    var extension = url.substring(dot + 1);
    if(DEBUG)
        console.log(mime.lookup(extension));
    return mime.lookup(extension);
}

// Deliver the file that has been read in to the browser.
function deliver(response , type : string | boolean, err, content) {
    if (err) return fail(response, NotFound, "File not found");
    var typeHeader = { "Content-Type": type };
    response.writeHead(OK, typeHeader);
    response.write(content);
    response.end();
}

// Give a minimal failure response to the browser
function fail(response, code, text) {
    var textTypeHeader = { "Content-Type": "text/plain" };
    response.writeHead(code, textTypeHeader);
    response.write(text, "utf8");
    response.end();
}

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
        if (name != name.toLowerCase())
            banned.push(file.toLowerCase());
        var mode = fs.statSync(root + file).mode;
        if ((mode & folderBit) == 0) continue;
        banUpperCase(root, file);
    }
}

function changeURLOnType( url, type ){
    console.log(url,type);
    switch (type) {
        case "application/javascript":
            url = "./scripts" + url;
            break;
        default:
            url = "./public" + url;
    }
    return url;
}
