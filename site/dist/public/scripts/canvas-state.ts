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
}
type Shape = Circle | Rectangle | Text

function toCSSColour( col : Colour ) : string
{
    return ['rgb(',')'].join([col.red,col.green,col.blue].join(','));
}
function intersects( point : Point, shape : Shape ) : boolean
{
    if( shape.kind == 'Circle')
    {
        var dx : number = point.x - shape.centre.x;
        var dy : number = point.y - shape.centre.y;
        return Math.pow(dx,2) + Math.pow(dy,2) <= Math.pow(shape.radius,2);
    }
    else if (shape.kind == 'Rectangle'){
        return point.x >= shape.centre.x - shape.width  &&
               point.x <= shape.centre.x + shape.width  &&
               point.y >= shape.centre.y - shape.height &&
               point.y <= shape.centre.y + shape.height;
    }
    else if (shape.kind == 'Text'){
        console.error('Text doesn\'t have intersect code yet');
    }
}
class CanvasState{
    private shapes : Shape[];
    private shapeSelected : boolean;
    selected : [number,Shape];

    constructor(){
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
            this.selected[1].centre = coord;
            this.replaceShape(this.selected[0],this.selected[1]);
        }
    }
    getShapes() : Shape[]
    {
        return this.shapes;
    }
}
