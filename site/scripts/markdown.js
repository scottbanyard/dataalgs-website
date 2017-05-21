"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("ts-optional");
"use strict";
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
var headerTokens = [1, 2, 3, 4, 5, 6].map((num) => simpleToken(simpleHeaderPattern(num), 'h' + num)).concat([simpleToken(/(.*)[^]={6}/gm, 'h1'),
    simpleToken(/(.*)[^]-{6}/gm, 'h2')]);
var emphTokens = [simpleToken(emphasisPattern(String.raw `\*\*`), 'b'),
    simpleToken(emphasisPattern('__'), 'b'),
    simpleToken(emphasisPattern(String.raw `\*`), 'i'),
    simpleToken(emphasisPattern('_'), 'i'),
    simpleToken(emphasisPattern('~~'), 'del')
];
function renderLink(text) {
    var parts = text.slice(1, text.length - 1).split('](');
    var opentag = '<a href="' + parts[1].trim() + '" >';
    var closetag = '</a>';
    return opentag + parts[0] + closetag;
}
var reference = /\[([^\]]*)\]/g;
var url = new RegExp(String.raw `<?((?:https?|ftp):\/\/(?:[\w+?\.\w+])+(?:[a-zA-Z0-9\~\!\@\#\$\%\^\&\*\(\)_\-\=\+\\\/\?\.\:\;\'\,]*)?)>?`, 'g');
var imageRef = new RegExp(String.raw `!\[(.*)\]\((\d+)\)`);
var inlinelinkregex = new RegExp(reference.source +
    String.raw `\(` +
    url.source + String.raw `(?:\s+"([^"]*)")?\)`, 'g');
var inlinelink = [inlinelinkregex, '<a href="$2" name="$3">$1</a>'];
var urlToken = [new RegExp('\\s+' + url.source + '\\s+'), '<a href="$1">$1</a>'];
var referenceLink = new RegExp(reference.source + reference.source, 'g');
var refWithURL = new RegExp(reference.source + /:\s*/ + url.source);
var links = String.raw `
[Text taken from](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)

# H1
## H2
### H3
#### H4
##### H5
###### H6

Alternatively, for H1 and H2, an underline-ish style:

Alt-H1
======

Alt-H2
------

[I'm an inline-style link](https://www.google.com)

[I'm an inline-style link with title](https://www.google.com "Google's Homepage")

[I'm a reference-style link][Arbitrary case-insensitive reference text]

[You can use numbers for reference-style link definitions][1]

Emphasis, aka italics, with *asterisks* or _underscores_.Strong emphasis, aka bold, with **asterisks** or __underscores__. Combined emphasis with **asterisks and _underscores_**. Strikethrough uses two tildes. ~~Scratch this.~~

Some text to show that the reference links can follow later.

[arbitrary case-insensitive reference text]: https://www.mozilla.org
[1]: http://slashdot.org/test
[link text itself]: http://www.reddit.com/haskell`;
var emphText = "Emphasis, aka italics, with *asterisks* or _underscores_.Strong emphasis, aka bold, with **asterisks** or __underscores__. Combined emphasis with **asterisks and _underscores_**. Strikethrough uses two tildes. ~~Scratch this.~~";
var lists = ["* List item", "* List item", "    * List item"];
var headers = [1, 2, 3, 4, 5, 6].map((num) => "#".repeat(num) + " header" + num);
var emphasis = ['**', "__", '*', '_'].map((char) => char + 'sentence' + char);
function tokenise(text, tokens) {
    for (var t in tokens) {
        text = text.replace(tokens[t][0], tokens[t][1]);
    }
    return text;
}
function collectAndRemoveReferences(text, withScope) {
    var ids = [];
    text = text.replace(imageRef, (text, alt, imageID) => {
        var scopeVar = 'image' + imageID;
        if (withScope) {
            var tag = '<img data-ng-src="{{ ' + scopeVar + ' }}"' +
                ' alt-text="' + alt + '"' +
                ' data-ng-show="' + scopeVar + '" />';
        }
        else {
            var tag = '<img src="{{ ' + scopeVar + ' }}"' +
                ' alt-text="' + alt + '" />';
        }
        ids.push(imageID);
        return tag;
    });
    var referencePair = new RegExp(reference.source + ':\\s*' + url.source, 'g');
    var references = text.match(referencePair);
    if (references) {
        var kvPairs = references.map((t) => [t.replace(referencePair, '$1'),
            t.replace(referencePair, '$2')]);
        text = text.replace(referencePair, '');
        for (var j = 0; j < kvPairs.length; j++) {
            var pattern = new RegExp(reference.source + '\\[' + kvPairs[j][0] + '\\]', 'i');
            text = text.replace(pattern, '[$1]\(' + kvPairs[j][1] + '\)');
        }
    }
    return [text, ids];
}
var tokens = headerTokens.concat(emphTokens);
tokens.push(inlinelink);
function returnHTML(page, withScope) {
    var newPage = collectAndRemoveReferences(page, withScope);
    newPage[0] = tokenise(newPage[0], tokens).trim();
    return newPage;
}
exports.returnHTML = returnHTML;
