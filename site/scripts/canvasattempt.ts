import { encodePNG, make }  from 'pureimage';
import { createWriteStream } from 'fs';

var img1 = make(100,50);

var ctx = img1.getContext('2d');
// ctx.fillStyle = 'rgba(255,0,0,0.5)';
ctx.fillRect(0,0,100,100);

encodePNG(img1, createWriteStream('out.png'), function(err) {
    console.log("wrote out the png file to out.png");
});
