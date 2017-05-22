"use strict";
exports.__esModule = true;
var headerTokens = [1, 2, 3, 4, 5, 6]
    .map(function (num) { return simpleToken(new RegExp('^#{' + num + '} (.*)', 'gm'), 'h' + num); })
    .concat([simpleToken(/(.*)[^]={6}/gm, 'h1'),
    simpleToken(/(.*)[^]-{6}/gm, 'h2')]);
var emphTokens = [simpleToken(emphasisPattern((_a = ["**"], _a.raw = ["\\*\\*"], String.raw(_a))), 'b'),
    simpleToken(emphasisPattern('__'), 'b'),
    simpleToken(emphasisPattern((_b = ["*"], _b.raw = ["\\*"], String.raw(_b))), 'i'),
    simpleToken(emphasisPattern('_'), 'i'),
    simpleToken(emphasisPattern('~~'), 'del')
];
// NB the contents of the brackets can be aquired with $1
exports.reference = /\[([^\]]*)\]/g;
exports.url = new RegExp((_c = ["<?((?:https?|ftp)://(?:[w+?.w+])+(?:[a-zA-Z0-9~!@#$%^&*()_-=+\\/?.:;',]*)?)>?"], _c.raw = ["<?((?:https?|ftp):\\/\\/(?:[\\w+?\\.\\w+])+(?:[a-zA-Z0-9\\~\\!\\@\\#\\$\\%\\^\\&\\*\\(\\)_\\-\\=\\+\\\\\\/\\?\\.\\:\\;\\'\\,]*)?)>?"], String.raw(_c)), 'g');
exports.imageRef = new RegExp((_d = ["![([^]]+)]((d+))"], _d.raw = ["!\\[([^\\]]+)\\]\\((\\d+)\\)"], String.raw(_d)), 'g');
var inlinelinkregex = new RegExp(exports.reference.source + (_e = ["("], _e.raw = ["\\("], String.raw(_e)) +
    exports.url.source + (_f = ["(?:s+\"([^\"]*)\")?)"], _f.raw = ["(?:\\s+\"([^\"]*)\")?\\)"], String.raw(_f)), 'g');
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
/*
    This script tag is from
    https://stackoverflow.com/questions/6659351/removing-all-script-tags-from-html-with-js-regular-expression
*/
var scriptTag = [new RegExp((_g = ["<script\b[^<]*(?:(?!</script>)<[^<]*)*</script>"], _g.raw = ["<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>"], String.raw(_g)), 'gi'), ''];
exports.tokens = headerTokens.concat(emphTokens, [scriptTag, link]);
var _a, _b, _c, _d, _e, _f, _g;
