/*
    A collection of all the regex tokens used by the markdown converter.
    The flavour of markdown supported can be found at
     https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet
*/
"use strict";

export type Token = [RegExp,string];

/* Support for 6 header levels, as well as the two alternative formats */
var headerTokens : Token[] =[1,2,3,4,5,6]
    .map((num)=>simpleToken(new RegExp('^#{'+num+'} (.*)','gm'),'h'+num))
    .concat([ simpleToken(/(.*)[^]={6}/gm, 'h1'),
              simpleToken(/(.*)[^]-{6}/gm, 'h2') ]);


/* Various forms of bold or emphasis markings */
var emphTokens : Token[] =
    [ simpleToken(emphasisPattern(String.raw`\*\*`),'b'),
      simpleToken(emphasisPattern('__'),'b'),
      simpleToken(emphasisPattern(String.raw`\*`),'i'),
      simpleToken(emphasisPattern('_'),'i'),
      simpleToken(emphasisPattern('~~'),'del')
  ];

/* References to urls, images or named urls */
export var reference : RegExp = /\[([^\]]*)\]/g;
/* URL regex, modified from one found in the community at http://regexr.com */
export var url : RegExp = new RegExp(String.raw`<?((?:https?|ftp):\/\/(?:[\w+?\.\w+])+(?:[a-zA-Z0-9\~\!\@\#\$\%\^\&\*\(\)_\-\=\+\\\/\?\.\:\;\'\,]*)?)>?`, 'g');

/* Images are referenced by the ![alt-text](reference) syntax, where reference
   is the id attributed to an image by our database
*/
export var imageRef : RegExp = new RegExp(String.raw`!\[([^\]]+)\]\((\d+)\)`,'g');

// Inline link regex
var inlinelinkregex : RegExp = new RegExp( reference.source +
                                           String.raw`\(` +
                                           url.source +  String.raw`(?:\s+"([^"]*)")?\)`,
                                             'g' );
// Token corresponding to the inlinelinkregex
var link : Token = [inlinelinkregex,'<a href="$2" name="$3">$1</a>'];

/* Helper function to create a token from a regex and the
   string corresponding to the html tag */
function simpleToken(pattern : RegExp, innerTag : string ) : Token
{
    return [pattern, '<' + innerTag + '>$1</' +innerTag + '>' ];
}
/* All the emphasis and bold patterns have the same general format */
function emphasisPattern( pattern: string) : RegExp
{
    return new RegExp(pattern+'([^'+pattern+']*)' + pattern,'g');
}
/*
    This script tag is from
    https://stackoverflow.com/questions/6659351/removing-all-script-tags-from-html-with-js-regular-expression
*/
var scriptTag : Token = [new RegExp(String.raw`<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>`,'gi'),''];
export var tokens = headerTokens.concat(emphTokens,[scriptTag,link]);
