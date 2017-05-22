"use strict";
exports.__esModule = true;
var tokens_1 = require("./tokens");
function replaceImages(text, withScope) {
    var ids = [];
    text = text.replace(tokens_1.imageRef, function (_, alt, imageID) {
        var scopeVar = 'image' + imageID;
        var src = withScope ?
            'data-ng-src="{{ ' + scopeVar + ' }}" data-ng-show="' + scopeVar + '"'
            : 'src="{{ ' + scopeVar + ' }}"';
        ids.push(imageID);
        return '<img class="img-center" ' + src + ' alt-text="' + alt + '" /> <br />';
    });
    return [text, ids];
}
/*
    Takes in the raw markdown string, as well as an indicator as to whether the
    images will be inserted with an angular $scope or not.

    Replaces markdown text with valid html, and strips out <script> tags
*/
function returnHTML(text, withScope) {
    // First, images are replaced by either a $scope style reference or a
    // src identifier
    var ids = [];
    _a = replaceImages(text, withScope), text = _a[0], ids = _a[1];
    /*
        Since links can use references, it is necessary to collect all
        possible references
    */
    var referencePair = new RegExp(tokens_1.reference.source + ':\\s*' + tokens_1.url.source, 'g');
    var kvPairs = [];
    text = text.replace(referencePair, function (t, id, ref) {
        kvPairs.push([id, ref]);
        return '';
    });
    /*
        Once the references have been acquired, the raw url is inserted into
        their reference point
    */
    kvPairs.forEach(function (_a) {
        var id = _a[0], ref = _a[1];
        var pattern = new RegExp(tokens_1.reference.source + '\\[' + id + '\\]', 'i');
        text = text.replace(pattern, '[$1]\(' + ref + '\)');
    });
    // console.log(2, text)
    // Basic tokens such as headers and emphasis are then replaced
    text = tokens_1.tokens.reduce(function (acc, tok) { return acc.replace(tok[0], tok[1]); }, text).trim();
    return [text, ids];
    var _a;
}
exports.returnHTML = returnHTML;
