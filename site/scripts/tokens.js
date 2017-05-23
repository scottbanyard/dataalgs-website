/*
    A collection of all the regex tokens used by the markdown converter.
    The flavour of markdown supported can be found at
     https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet
*/
"use strict";
exports.__esModule = true;
/* Support for 6 header levels, as well as the two alternative formats */
var headerTokens = [1, 2, 3, 4, 5, 6]
    .map(function (num) { return simpleToken(new RegExp('^#{' + num + '} (.*)', 'gm'), 'h' + num); })
    .concat([simpleToken(/(.*)[^]={6}/gm, 'h1'),
    simpleToken(/(.*)[^]-{6}/gm, 'h2')]);
/* Various forms of bold or emphasis markings */
var emphTokens = [simpleToken(emphasisPattern((_a = ["**"], _a.raw = ["\\*\\*"], String.raw(_a))), 'b'),
    simpleToken(emphasisPattern('__'), 'b'),
    simpleToken(emphasisPattern((_b = ["*"], _b.raw = ["\\*"], String.raw(_b))), 'i'),
    simpleToken(emphasisPattern('_'), 'i'),
    simpleToken(emphasisPattern('~~'), 'del')
];
/* References to urls, images or named urls */
exports.reference = /\[([^\]]*)\]/g;
/* URL regex, modified from one found in the community at http://regexr.com */
exports.url = new RegExp((_c = ["<?((?:https?|ftp)://(?:[w+?.w+])+(?:[a-zA-Z0-9~!@#$%^&*()_-=+\\/?.:;',]*)?)>?"], _c.raw = ["<?((?:https?|ftp):\\/\\/(?:[\\w+?\\.\\w+])+(?:[a-zA-Z0-9\\~\\!\\@\\#\\$\\%\\^\\&\\*\\(\\)_\\-\\=\\+\\\\\\/\\?\\.\\:\\;\\'\\,]*)?)>?"], String.raw(_c)), 'g');
/* Images are referenced by the ![alt-text](reference) syntax, where reference
   is the id attributed to an image by our database
*/
exports.imageRef = new RegExp((_d = ["![([^]]+)]((d+))"], _d.raw = ["!\\[([^\\]]+)\\]\\((\\d+)\\)"], String.raw(_d)), 'g');
// Inline link regex
var inlinelinkregex = new RegExp(exports.reference.source + (_e = ["("], _e.raw = ["\\("], String.raw(_e)) +
    exports.url.source + (_f = ["(?:s+\"([^\"]*)\")?)"], _f.raw = ["(?:\\s+\"([^\"]*)\")?\\)"], String.raw(_f)), 'g');
// Token corresponding to the inlinelinkregex
var link = [inlinelinkregex, '<a href="$2" name="$3">$1</a>'];
/* Helper function to create a token from a regex and the
   string corresponding to the html tag */
function simpleToken(pattern, innerTag) {
    return [pattern, '<' + innerTag + '>$1</' + innerTag + '>'];
}
/* All the emphasis and bold patterns have the same general format */
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
