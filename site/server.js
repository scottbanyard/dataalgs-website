"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("ts-optional");
"use strict";
var DEBUG = false;
const http_1 = require("http");
const fs = require("fs");
const mime_types_1 = require("mime-types");
const sqlite3 = require("sqlite3");
sqlite3.verbose();
var db = new sqlite3.Database(':memory:');
var OK = 200, NotFound = 404, BadType = 415, Error = 500;
var banned;
start(8080);
db.serialize(function () {
    db.run("CREATE TABLE lorem (info TEXT)");
    var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
    for (var i = 0; i < 10; i++) {
        stmt.run("Ipsum " + i);
    }
    stmt.finalize();
    db.each("SELECT rowid AS id, info FROM lorem", function (err, row) {
        console.log(row.id + ": " + row.info);
    });
});
db.close();
function start(port) {
    banned = [];
    banUpperCase("./public/", "");
    var service = http_1.createServer(handle);
    service.listen(port, "localhost");
    var address = "http://localhost";
    if (port != 80)
        address = address + ":" + port;
    console.log("Server running at", address);
}
function handle(request, response) {
    console.log(request.url);
    var url = request.url.toLowerCase();
    if (url.endsWith("/"))
        url = url + "index.xhtml";
    var type = findType(url);
    if (type.isNil) {
        fail(response, BadType, "File type unsupported");
    }
    else {
        var typeHeader = mime_types_1.contentType(type.valueOf());
        url = typeDirectory(type.valueOf()) + url;
        if (isBanned(url))
            return fail(response, NotFound, "URL has been banned");
        fs.readFile(url, (err, content) => deliver(response, mime_types_1.contentType(type.valueOf()), err, content));
    }
}
function isBanned(url) {
    for (var i = 0; i < banned.length; i++) {
        var b = banned[i];
        if (url.startsWith(b))
            return true;
    }
    return false;
}
function findType(url) {
    var dot = url.lastIndexOf(".");
    var extension = url.substring(dot + 1);
    var type = mime_types_1.lookup(extension);
    if (type == null || typeof type === "boolean")
        return nil;
    else
        return type;
}
function deliver(response, typeHeader, err, content) {
    if (err)
        return fail(response, NotFound, "File not found");
    response.writeHead(OK, typeHeader);
    response.write(content);
    response.end();
}
function fail(response, code, text) {
    var textTypeHeader = { "Content-Type": "text/plain" };
    response.writeHead(code, textTypeHeader);
    response.write(text, "utf8");
    response.end();
    return nil;
}
function banUpperCase(root, folder) {
    var folderBit = 1 << 14;
    var names = fs.readdirSync(root + folder);
    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        var file = folder + "/" + name;
        if (name != name.toLowerCase())
            banned.push(file.toLowerCase());
        var mode = fs.statSync(root + file).mode;
        if ((mode & folderBit) == 0)
            continue;
        banUpperCase(root, file);
    }
}
function typeDirectory(type) {
    switch (type) {
        case "application/javascript":
            return "./scripts";
        default:
            return "./public";
    }
}
