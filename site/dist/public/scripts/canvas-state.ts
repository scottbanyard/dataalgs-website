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

type Shape = Circle | Rectangle

function toCSSColour( col : Colour ) : string
{
    return ['rgb(',')'].join([col.red,col.green,col.blue].join(','));
}
function intersects( point : Point, shape : Shape ) : boolean
{
    if( shape.kind == 'Circle')
    {
        var dx : number = point.x - shape.centre.y;
        var dy : number = point.y - shape.centre.y;
        return (dx^2 + dy^2) <= (shape.radius^2);
    }
    else if (shape.kind == 'Rectangle'){
        return point.x >= shape.centre.x - shape.width  &&
               point.x <= shape.centre.x + shape.width  &&
               point.y >= shape.centre.y - shape.height &&
               point.y <= shape.centre.y + shape.height;
    }
}
class CanvasState{
    private shapes : Shape[];
    // This index of the currently selected shape, -1 if no shape is selected
    selected : number;

    constructor(){
        this.shapes = [];
    }
    addShape(shape:Shape)
    {
        this.shapes.push(shape);
    }
    replaceShape( index : number, shape:Shape )
    {
        if( index >= 0 && index < this.shapes.length ){
            this.shapes[index] = shape;
        }
    }
    selectedShape( click : Point) : Optional<[number,Shape]>
    {
        var index : number = this.shapes.findIndex(intersects.bind(click));
        this.selected = index;
        if( index == -1)
            return nil;
        else
            return [index, this.shapes[index]];
    }
    getShapes() : Shape[]
    {
        return this.shapes;
    }
}
