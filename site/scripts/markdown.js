"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tokens_1 = require("./tokens");
function replaceImages(text, withScope) {
    var ids = [];
    text = text.replace(tokens_1.imageRef, (_, alt, imageID, imageURL) => {
        if (imageID) {
            var scopeVar = 'image' + imageID;
            var src = withScope ?
                'data-ng-src="{{ ' + scopeVar + ' }}" data-ng-show="' + scopeVar + '"'
                : 'src="{{ ' + scopeVar + ' }}"';
            ids.push(imageID);
        }
        else {
            var src = 'src="' + imageURL + '"';
        }
        return '<img class="img-center" ' + src + ' alt-text="' + alt + '" /> <br />';
    });
    return [text, ids];
}
function returnHTML(text, withScope) {
    var ids = [];
    [text, ids] = replaceImages(text, withScope);
    var referencePair = new RegExp(tokens_1.reference.source + ':\\s*' + tokens_1.url.source, 'g');
    var kvPairs = [];
    text = text.replace(referencePair, (t, id, ref) => {
        kvPairs.push([id, ref]);
        return '';
    });
    kvPairs.forEach(([id, ref]) => {
        var pattern = new RegExp(tokens_1.reference.source + '\\[' + id + '\\]', 'i');
        text = text.replace(pattern, '[$1]\(' + ref + '\)');
    });
    text = tokens_1.tokens.reduce((acc, tok) => acc.replace(tok[0], tok[1]), text).trim();
    return [text, ids];
}
exports.returnHTML = returnHTML;
