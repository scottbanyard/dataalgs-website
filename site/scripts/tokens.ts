"use strict";

export type Token = [RegExp,string];

var headerTokens : Token[] =[1,2,3,4,5,6]
    .map((num)=>simpleToken(new RegExp('^#{'+num+'} (.*)','gm'),'h'+num))
    .concat([ simpleToken(/(.*)[^]={6}/gm, 'h1'),
              simpleToken(/(.*)[^]-{6}/gm, 'h2') ]);


var emphTokens : Token[] =
    [ simpleToken(emphasisPattern(String.raw`\*\*`),'b'),
      simpleToken(emphasisPattern('__'),'b'),
      simpleToken(emphasisPattern(String.raw`\*`),'i'),
      simpleToken(emphasisPattern('_'),'i'),
      simpleToken(emphasisPattern('~~'),'del')
  ];

// NB the contents of the brackets can be aquired with $1
export var reference : RegExp = /\[([^\]]*)\]/g;
export var url : RegExp = new RegExp(String.raw`<?((?:https?|ftp):\/\/(?:[\w+?\.\w+])+(?:[a-zA-Z0-9\~\!\@\#\$\%\^\&\*\(\)_\-\=\+\\\/\?\.\:\;\'\,]*)?)>?`, 'g');

export var imageRef : RegExp = new RegExp(String.raw`!\[([^\]]+)\]\((\d+)\)`,'g');
var inlinelinkregex : RegExp = new RegExp( reference.source +
                                           String.raw`\(` +
                                           url.source +  String.raw`(?:\s+"([^"]*)")?\)`,
                                             'g' );

var link : Token = [inlinelinkregex,'<a href="$2" name="$3">$1</a>'];

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
/*
    This script tag is from
    https://stackoverflow.com/questions/6659351/removing-all-script-tags-from-html-with-js-regular-expression
*/
var scriptTag : Token = [new RegExp(String.raw`<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>`,'gi'),''];
export var tokens = headerTokens.concat(emphTokens,[scriptTag,link]);
