/// <reference path="node_modules/ts-optional/index.d.ts" />
require("ts-optional")

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
import { createServer } from "http";
import * as fs from "fs";
import { lookup, contentType } from "mime-types";
import * as sqlite3 from 'sqlite3';
sqlite3.verbose();
var db = new sqlite3.Database('database.sqlite'); // persistent database file (':memory:' is a non-persistent database in memory)
var OK = 200, NotFound = 404, BadType = 415, Error = 500;
var banned;
start(8080);

// db.serialize(function() {
//   db.run("CREATE TABLE IF NOT EXISTS lorem (info TEXT)");
//
//   var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
//   for (var i = 0; i < 10; i++) {
//       stmt.run("Ipsum " + i);
//   }
//   stmt.finalize();
//
//   db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
//       console.log(row.id + ": " + row.info);
//   });
// });
//
// db.close();

// Start the http service.  Accept only requests from localhost, for security.
function start( port : number ) : void {
    banned = [];
    banUpperCase("./public/", "");
    var service = createServer(handle);
    service.listen(port, "localhost");
    var address = "http://localhost";
    if (port != 80)
        address = address + ":" + port;
    console.log("Server running at", address);
}

// Serve a request by delivering a file.
function handle(request, response) {
    console.log(request.url);
    var url : string = request.url.toLowerCase();
    if (url.endsWith("/"))
        url = url + "index.xhtml";

    var type : Optional<string> = findType( url );
    if( type.isNil ) {
        fail(response, BadType, "File type unsupported");
    }
    else {
        var typeHeader = contentType( type.valueOf() );
        url = typeDirectory( type.valueOf() ) + url;
        if (isBanned(url))
            return fail(response, NotFound, "URL has been banned");

        fs.readFile(url, (err, content) =>
                        deliver(response, contentType(type.valueOf()), err, content));
    }

}

// Forbid any resources which shouldn't be delivered to the browser.
function isBanned( url : string ) : boolean {
    for (var i=0; i<banned.length; i++) {
        var b = banned[i];
        if (url.startsWith(b))
            return true;
    }
    return false;
}

// Find the content type to respond with, or undefined.
function findType( url : string ) : Optional<string> {
    var dot = url.lastIndexOf(".");
    var extension : string = url.substring(dot + 1);
    var type = lookup(extension);

    if (type == null || typeof type === "boolean" )
        return nil;
    else
        return type;
}

// Deliver the file that has been read in to the browser.
function deliver(response , typeHeader, err, content) {
    if (err)
        return fail(response, NotFound, "File not found");
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
    return nil;
}

// Check a folder for files/subfolders with non-lowercase names.  Add them to
// the banned list so they don't get delivered, making the site case sensitive,
// so that it can be moved from Windows to Linux, for example. Synchronous I/O
// is used because this function is only called during startup.  This avoids
// expensive file system operations during normal execution.  A file with a
// non-lowercase name added while the server is running will get delivered, but
// it will be detected and banned when the server is next restarted.
function banUpperCase(root : string, folder : string) : void {
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

function typeDirectory( type : string ) : string {
    switch (type) {
        case "application/javascript":
            return "./scripts";
        default:
            return "./public";
    }
}
