"use strict";
exports.__esModule = true;
/// <reference path="../node_modules/ts-optional/index.d.ts" />
require("ts-optional");
"use strict";
// class Token{
//     constructor(public name : string, public matcher:RegExp,public pattern : string ){}
//
//     public findAndReplace(text : string) : string {
//         return text.replace(this.matcher,this.pattern);
//     }
// }
function addTags(tagkind, contents) {
    return '<' + tagkind + '>' + contents + '</' + tagkind + '>';
}
function simpleHeaderPattern(num) {
    return new RegExp('^#{' + num + '} (.*)', 'gm');
}
function simpleToken(pattern, innerTag) {
    return [pattern, '<' + innerTag + '>$1</' + innerTag + '>'];
}
function emphasisPattern(pattern) {
    return new RegExp(pattern + '([^' + pattern + ']*)' + pattern, 'g');
}
var headerTokens = [1, 2, 3, 4, 5, 6].map(function (num) { return simpleToken(simpleHeaderPattern(num), 'h' + num); }).concat([simpleToken(/(.*)[^]={6}/gm, 'h1'),
    simpleToken(/(.*)[^]-{6}/gm, 'h2')]);
var emphTokens = [simpleToken(emphasisPattern((_a = ["**"], _a.raw = ["\\*\\*"], String.raw(_a))), 'b'),
    simpleToken(emphasisPattern('__'), 'b'),
    simpleToken(emphasisPattern((_b = ["*"], _b.raw = ["\\*"], String.raw(_b))), 'i'),
    simpleToken(emphasisPattern('_'), 'i'),
    simpleToken(emphasisPattern('~~'), 'del')
];
function renderLink(text) {
    var parts = text.slice(1, text.length - 1).split('](');
    var opentag = '<a href="' + parts[1].trim() + '" >';
    var closetag = '</a>';
    return opentag + parts[0] + closetag;
}
// NB the contents of the brackets can be aquired with $1
var reference = /\[([^\]]*)\]/g;
var url = new RegExp((_c = ["<?((?:https?|ftp)://(?:[w+?.w+])+(?:[a-zA-Z0-9~!@#$%^&*()_-=+\\/?.:;',]*)?)>?"], _c.raw = ["<?((?:https?|ftp):\\/\\/(?:[\\w+?\\.\\w+])+(?:[a-zA-Z0-9\\~\\!\\@\\#\\$\\%\\^\\&\\*\\(\\)_\\-\\=\\+\\\\\\/\\?\\.\\:\\;\\'\\,]*)?)>?"], String.raw(_c)), 'g');
// console.log("http://foo.co.uk/ \
// http://regexr.com/foo.html?q=bar \
// https://mediatemple.net".match(url));
var inlinelinkregex = new RegExp(reference.source + (_d = ["("], _d.raw = ["\\("], String.raw(_d)) +
    url.source + (_e = ["(?:s+\"([^\"]*)\")?)"], _e.raw = ["(?:\\s+\"([^\"]*)\")?\\)"], String.raw(_e)), 'g');
var inlinelink = [inlinelinkregex, '<a href="$2" name="$3">$1</a>'];
var urlToken = [new RegExp('\\s+' + url.source + '\\s+'), '<a href="$1">$1</a>'];
var referenceLink = new RegExp(reference.source + reference.source, 'g');
var refWithURL = new RegExp(reference.source + /:\s*/ + url.source);
// Tests and examples
var links = (_f = ["\n[Text taken from](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)\n\n# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6\n\nAlternatively, for H1 and H2, an underline-ish style:\n\nAlt-H1\n======\n\nAlt-H2\n------\n\n[I'm an inline-style link](https://www.google.com)\n\n[I'm an inline-style link with title](https://www.google.com \"Google's Homepage\")\n\n[I'm a reference-style link][Arbitrary case-insensitive reference text]\n\n[You can use numbers for reference-style link definitions][1]\n\nEmphasis, aka italics, with *asterisks* or _underscores_.Strong emphasis, aka bold, with **asterisks** or __underscores__. Combined emphasis with **asterisks and _underscores_**. Strikethrough uses two tildes. ~~Scratch this.~~\n\nSome text to show that the reference links can follow later.\n\n[arbitrary case-insensitive reference text]: https://www.mozilla.org\n[1]: http://slashdot.org/test\n[link text itself]: http://www.reddit.com/haskell"], _f.raw = ["\n[Text taken from](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)\n\n# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6\n\nAlternatively, for H1 and H2, an underline-ish style:\n\nAlt-H1\n======\n\nAlt-H2\n------\n\n[I'm an inline-style link](https://www.google.com)\n\n[I'm an inline-style link with title](https://www.google.com \"Google's Homepage\")\n\n[I'm a reference-style link][Arbitrary case-insensitive reference text]\n\n[You can use numbers for reference-style link definitions][1]\n\nEmphasis, aka italics, with *asterisks* or _underscores_.Strong emphasis, aka bold, with **asterisks** or __underscores__. Combined emphasis with **asterisks and _underscores_**. Strikethrough uses two tildes. ~~Scratch this.~~\n\nSome text to show that the reference links can follow later.\n\n[arbitrary case-insensitive reference text]: https://www.mozilla.org\n[1]: http://slashdot.org/test\n[link text itself]: http://www.reddit.com/haskell"], String.raw(_f));
var emphText = "Emphasis, aka italics, with *asterisks* or _underscores_.Strong emphasis, aka bold, with **asterisks** or __underscores__. Combined emphasis with **asterisks and _underscores_**. Strikethrough uses two tildes. ~~Scratch this.~~";
var lists = ["* List item", "* List item", "    * List item"];
var headers = [1, 2, 3, 4, 5, 6].map(function (num) { return "#".repeat(num) + " header" + num; });
var emphasis = ['**', "__", '*', '_'].map(function (char) { return char + 'sentence' + char; });
function tokenise(text, tokens) {
    for (var t in tokens) {
        text = text.replace(tokens[t][0], tokens[t][1]);
    }
    return text;
}
function collectAndRemoveReferences(text) {
    // \[([^\]]*)\]
    // :\s*<?((?:https?:\/\/|https?:\/\/www\.|www\.)[^\.]+(?:\.\w+)+)(?:\/\w*)*>?
    var referencePair = new RegExp(reference.source + ':\\s*' + url.source, 'g');
    var references = text.match(referencePair);
    if (references) {
        var kvPairs = references.map(function (t) { return [t.replace(referencePair, '$1'),
            t.replace(referencePair, '$2')]; });
        text = text.replace(referencePair, '');
        for (var j = 0; j < kvPairs.length; j++) {
            var pattern = new RegExp(reference.source + '\\[' + kvPairs[j][0] + '\\]', 'i');
            text = text.replace(pattern, '[$1]\(' + kvPairs[j][1] + '\)');
        }
    }
    return text;
}
var tokens = headerTokens.concat(emphTokens);
tokens.push(inlinelink);
function returnHTML(page) {
    var newPage = collectAndRemoveReferences(page);
    newPage = tokenise(newPage, tokens);
    return newPage.trim();
}
exports.returnHTML = returnHTML;
var _a, _b, _c, _d, _e, _f;
