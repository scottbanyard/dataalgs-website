"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DEBUG = false;
const fs = require("fs");
var mime = require("mime-types");
var OK = 200, NotFound = 404, BadType = 415, Error = 500;
var banned;
start(8080);
function start(port) {
    banned = [];
    banUpperCase("./public/", "");
    var service = createServer(handle);
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
    url = changeURLOnType(url, type);
    if (isBanned(url))
        return fail(response, NotFound, "URL has been banned");
    fs.readFile(url, function (err, content) {
        deliver(response, type, err, content);
    });
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
    if (DEBUG)
        console.log(lookup(extension));
    return lookup(extension);
}
function deliver(response, type, err, content) {
    if (err)
        return fail(response, NotFound, "File not found");
    var typeHeader = { "Content-Type": type };
    response.writeHead(OK, typeHeader);
    response.write(content);
    response.end();
}
function fail(response, code, text) {
    var textTypeHeader = { "Content-Type": "text/plain" };
    response.writeHead(code, textTypeHeader);
    response.write(text, "utf8");
    response.end();
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
function changeURLOnType(url, type) {
    if (type == null)
        return fail(response, BadType, "File type unsupported");
    console.log(url, type);
    switch (type) {
        case "application/javascript":
            url = "./scripts" + url;
            break;
        default:
            url = "./public" + url;
    }
    return url;
}
