interface Colour {
    red : string;
    green : string;
    blue : string;
}
interface Point {
    x : number;
    y : number;
}
interface ShapeFeatures{
    centre : Point;
    colour : Colour;
}
interface Line extends ShapeFeatures {
    kind : 'Line'
    other : Point;
}
interface Circle extends ShapeFeatures {
    kind : 'Circle';
    radius : number;
}
interface Rectangle extends ShapeFeatures {
    kind : 'Rectangle';
    width : number;
    height : number;
}
interface Text extends ShapeFeatures {
    kind : 'Text';
    contents: string;
    font : string;
    width : number;
}
type Shape = Circle | Rectangle | Text | Line

// Formats a Colour object into an rgb(r,g,b) string
function toCSSColour( col : Colour ) : string
{
    return ['rgb(',')'].join([col.red,col.green,col.blue].join(','));
}
// Finds if a point intersects a shape
function intersects( point : Point, shape : Shape ) : boolean
{
    switch(shape.kind){
        case 'Circle':
            var dx : number = point.x - shape.centre.x;
            var dy : number = point.y - shape.centre.y;
            return Math.pow(dx,2) + Math.pow(dy,2) <= Math.pow(shape.radius,2);
        case 'Rectangle':
            return point.x >= shape.centre.x - shape.width  &&
                   point.x <= shape.centre.x + shape.width  &&
                   point.y >= shape.centre.y - shape.height &&
                   point.y <= shape.centre.y + shape.height;
        case 'Text':
            return point.x >= shape.centre.x &&
                   point.x <= shape.centre.x + shape.width  &&
                   point.y >= shape.centre.y - parseInt(shape.font) &&
                   point.y <= shape.centre.y;
        default:
            return false;
    }
}
class CanvasState{
    private shapes : Shape[];
    private shapeSelected : boolean;
    selected : [number,Shape];

    constructor(public width : number, public height : number){
        this.shapes = [];
        this.shapeSelected = false;
    }
    addShape(shape:Shape) : void
    {
        this.shapes.push(shape);
    }
    replaceShape( index : number, shape:Shape ) : void
    {
        if( index >= 0 && index < this.shapes.length ){
            this.shapes[index] = shape;
        }
    }
    setSelectedShape( click : Point ) : void
    {
        var index : number = this.shapes.findIndex(intersects.bind(null,click));
        if( index == -1)
            this.shapeSelected = false;
        else{
            this.shapeSelected = true;
            this.selected = [index, this.shapes[index]];
        }
    }
    deselectShape() : void
    {
        this.shapeSelected = false;
        this.selected = null;
    }
    moveShape( coord : Point ): void
    {
        if(this.shapeSelected){
            if(this.selected[1].kind=='Line')
                (<Line> this.selected[1]).other = coord;
            else
                this.selected[1].centre = coord;
            this.replaceShape(this.selected[0],this.selected[1]);
        }
    }
    getShapes() : Shape[]
    {
        return this.shapes;
    }
    redrawAll( ctx : CanvasRenderingContext2D ): void
    {
        ctx.clearRect(0, 0, this.width, this.height);
        this.shapes.map(this.drawShape.bind(this,ctx));
    }
    drawShape(context, shape, i)
    {
        if(this.shapeSelected && i == this.selected[0])
            context.strokeStyle = 'gold';
        else
            context.strokeStyle=toCSSColour(shape.colour);
        context.beginPath();
        var coords = shape.centre;
        if(shape.kind == 'Circle'){
            context.arc(coords.x, coords.y, shape.radius, 0, 2*Math.PI);
        }
        else if(shape.kind == 'Rectangle'){
            context.rect(coords.x-Math.round(shape.width/2),
                         coords.y-Math.round(shape.height/2),
                         shape.width, shape.height);
        }
        else if(shape.kind == 'Text'){
            context.font = shape.font;
            context.textAlign='left';
            context.fillText(shape.contents,coords.x,coords.y);
        }
        else if(shape.kind == 'Line'){
            context.moveTo(shape.centre.x,shape.centre.y);
            context.lineTo(shape.other.x, shape.other.y);
        }
        context.stroke();
        context.closePath();
    }
    createAndSelectLine(shape : ShapeFeatures) : void
    {
        var line = <Line> shape;
        line.other = shape.centre;

        this.addShape(line)

        this.selected = [this.shapes.length-1, line];
        this.shapeSelected = true;
    }
}
