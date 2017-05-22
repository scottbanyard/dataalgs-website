import { tokens, Token, imageRef, reference, url } from './tokens';

function replaceImages(text:string, withScope:boolean) : [string,string[]]
{
    var ids = [];
    text = text.replace(imageRef,(_,alt,imageID) => {
        var scopeVar = 'image' + imageID;
        var src = withScope?
            'data-ng-src="{{ '+ scopeVar +' }}" data-ng-show="'+scopeVar+'"'
            : 'src="{{ '+ scopeVar +' }}"';
        ids.push(imageID)
        return '<img ' + src + ' alt-text="' + alt +'" />';
    });
    return [text,ids];
}

/*
    Takes in the raw markdown string, as well as an indicator as to whether the
    images will be inserted with an angular $scope or not.

    Replaces markdown text with valid html, and strips out <script> tags
*/
export function returnHTML(text:string, withScope : boolean) :[string,string[]]
{
    // First, images are replaced by either a $scope style reference or a
    // src identifier
    var ids = [];
    [text,ids] = replaceImages(text, withScope);

    /*
        Since links can use references, it is necessary to collect all
        possible references
    */
    var referencePair = new RegExp(reference.source+':\\s*'+ url.source,'g');
    var kvPairs : [string,string][] = [];
    text = text.replace(referencePair, (t,id,ref) => {
         kvPairs.push([ id, ref ]);
         return '';
    });

    /*
        Once the references have been acquired, the raw url is inserted into
        their reference point
    */
    kvPairs.forEach(([id,ref]) => {
         var pattern = new RegExp(reference.source+'\\['+id+'\\]','i');
         text = text.replace(pattern,'[$1]\('+ref+'\)');
    });

    // console.log(2, text)
    // Basic tokens such as headers and emphasis are then replaced
    text = tokens.reduce((acc,tok)=> acc.replace(tok[0],tok[1]), text).trim();
    return [text,ids];
}
