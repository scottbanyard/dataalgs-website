/// <reference path="../node_modules/ts-optional/index.d.ts" />
require("ts-optional")
"use strict";

type Token = [RegExp,string];
// class Token{
//     constructor(public name : string, public matcher:RegExp,public pattern : string ){}
//
//     public findAndReplace(text : string) : string {
//         return text.replace(this.matcher,this.pattern);
//     }
// }

function addTags( tagkind: string, contents : String ) : string
{
    return '<'+tagkind +'>' + contents + '</'+tagkind +'>'
}

function simpleHeaderPattern( num : number ): RegExp
{
    return new RegExp('^#{' + num +'} (.*)','gm');
}
function simpleToken(pattern : RegExp, innerTag : string ) : Token
{
    return [pattern, '<' + innerTag + '>$1</' +innerTag + '>' ];
}

function emphasisPattern( pattern: string) : RegExp
{
    return new RegExp(pattern+'([^'+pattern+']*)' + pattern,'g');
}
var headerTokens : Token[] =
[1,2,3,4,5,6].map((num)=>simpleToken(simpleHeaderPattern(num),'h'+num)).concat(
[ simpleToken(/(.*)[^]={6}/gm, 'h1'),
  simpleToken(/(.*)[^]-{6}/gm, 'h2')]);


var emphTokens : Token[] =
    [ simpleToken(emphasisPattern(String.raw`\*\*`),'b'),
      simpleToken(emphasisPattern('__'),'b'),
      simpleToken(emphasisPattern(String.raw`\*`),'i'),
      simpleToken(emphasisPattern('_'),'i'),
      simpleToken(emphasisPattern('~~'),'del')
  ];

function renderLink(text : String) : String
{
    var parts = text.slice(1,text.length-1).split('](');
    var opentag = '<a href="' + parts[1].trim() + '" >';
    var closetag = '</a>';
    return opentag + parts[0]+ closetag;
}

// NB the contents of the brackets can be aquired with $1
var reference : RegExp = /\[([^\]]*)\]/g;
var url : RegExp = new RegExp(String.raw`<?((?:https?|ftp):\/\/(?:[\w+?\.\w+])+(?:[a-zA-Z0-9\~\!\@\#\$\%\^\&\*\(\)_\-\=\+\\\/\?\.\:\;\'\,]*)?)>?`, 'g');
// console.log("http://foo.co.uk/ \
// http://regexr.com/foo.html?q=bar \
// https://mediatemple.net".match(url));

var inlinelinkregex : RegExp = new RegExp( reference.source +
                                           String.raw`\(` +
                                           url.source +  String.raw`(?:\s+"([^"]*)")?\)`,
                                           'g' );

var inlinelink : Token = [inlinelinkregex,'<a href="$2" name="$3">$1</a>'];
var urlToken : Token = [new RegExp('\\s+' + url.source + '\\s+'),'<a href="$1">$1</a>'];

var referenceLink : RegExp = new RegExp( reference.source + reference.source,
                                         'g');
var refWithURL : RegExp = new RegExp( reference.source + /:\s*/ + url.source );


// Tests and examples
var links = String.raw`
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


var headers : string[] = [1,2,3,4,5,6].map((num) => "#".repeat(num) + " header"+num)
var emphasis : string[] = ['**',"__",'*','_'].map((char) => char + 'sentence' + char);

function tokenise(text:string, tokens:Token[]){
    for(var t in tokens){
        text = text.replace(tokens[t][0],tokens[t][1]);
    }
    return text;
}

function collectAndRemoveReferences(text:string): string
{
    // \[([^\]]*)\]
    // :\s*<?((?:https?:\/\/|https?:\/\/www\.|www\.)[^\.]+(?:\.\w+)+)(?:\/\w*)*>?

    var referencePair = new RegExp(reference.source+':\\s*'+ url.source,'g');
    var references = text.match(referencePair);
    if (references){
        var kvPairs : [string,string][] = references.map((t) : [string,string]=> [t.replace(referencePair,'$1'),
         t.replace(referencePair,'$2')]);
         text = text.replace(referencePair,'');

         for(var j =0; j< kvPairs.length; j++){
             var pattern = new RegExp(reference.source+'\\['+kvPairs[j][0]+'\\]','i');
             text = text.replace(pattern,'[$1]\('+kvPairs[j][1]+'\)');
         }
    }

    return text;
}
var tokens = headerTokens.concat(emphTokens);
tokens.push(inlinelink);

export function returnHTML(page:string) : string
{
    var newPage = collectAndRemoveReferences(page);
    newPage = tokenise(newPage,tokens);
    return newPage.trim();
}
