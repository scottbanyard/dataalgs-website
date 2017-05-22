"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var headerTokens = [1, 2, 3, 4, 5, 6]
    .map((num) => simpleToken(new RegExp('^#{' + num + '} (.*)', 'gm'), 'h' + num))
    .concat([simpleToken(/(.*)[^]={6}/gm, 'h1'),
    simpleToken(/(.*)[^]-{6}/gm, 'h2')]);
var emphTokens = [simpleToken(emphasisPattern(String.raw `\*\*`), 'b'),
    simpleToken(emphasisPattern('__'), 'b'),
    simpleToken(emphasisPattern(String.raw `\*`), 'i'),
    simpleToken(emphasisPattern('_'), 'i'),
    simpleToken(emphasisPattern('~~'), 'del')
];
exports.reference = /\[([^\]]*)\]/g;
exports.url = new RegExp(String.raw `<?((?:https?|ftp):\/\/(?:[\w+?\.\w+])+(?:[a-zA-Z0-9\~\!\@\#\$\%\^\&\*\(\)_\-\=\+\\\/\?\.\:\;\'\,]*)?)>?`, 'g');
exports.imageRef = new RegExp(String.raw `!\[([^\]]+)\]\((\d+)\)`, 'g');
var inlinelinkregex = new RegExp(exports.reference.source +
    String.raw `\(` +
    exports.url.source + String.raw `(?:\s+"([^"]*)")?\)`, 'g');
var link = [inlinelinkregex, '<a href="$2" name="$3">$1</a>'];
function simpleHeaderPattern(num) {
    return new RegExp('^#{' + num + '} (.*)', 'gm');
}
function simpleToken(pattern, innerTag) {
    return [pattern, '<' + innerTag + '>$1</' + innerTag + '>'];
}
function emphasisPattern(pattern) {
    return new RegExp(pattern + '([^' + pattern + ']*)' + pattern, 'g');
}
var scriptTag = [new RegExp(String.raw `<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>`, 'gi'), ''];
exports.tokens = headerTokens.concat(emphTokens, [scriptTag, link]);
