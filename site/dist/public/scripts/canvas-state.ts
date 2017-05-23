/*
    The workhorse for anything involving images on the site.
    Revolves around the CanvasState class
*/
import { Point, swapSmaller, add, difference } from './Point';
import { breshenham } from './Breshenham';
// Interface defining a Cour by red green blue strings
interface Colour {
    red : string;
    green : string;
    blue : string;
}

// Features that all shapes have
interface ShapeFeatures{
    centre : Point;
    colour : Colour;
}
// Lines and arrows
interface Line extends ShapeFeatures {
    kind : 'Line';
    other : Point;
    // Whether an arrowhead should be drawn onto the end of the line
    hasArrow : boolean;
    /*
       When calculating intersection for selection, it is necessary to know
       all the points a line covers
    */
    points : Point[];
}
// Simple circle type
interface Circle extends ShapeFeatures {
    kind : 'Circle';
    radius : number;
}
// Square type
interface Square extends ShapeFeatures {
    kind : 'Square';
    width : number;
    height : number;
}
// Text type
interface Text extends ShapeFeatures {
    kind : 'Text';
    contents: string;
    font : string;
    width : number;
}
/*
    A Tagged union type, which uses the kind attributes from the composite
    types to differentiate. Means that many objects can expect only a Shape and
    then dynamically dispatch to particular functions
*/
type Shape = Circle | Square | Text | Line

// Formats a Colour object into an rgb(r,g,b) string
function toCSSColour( col : Colour ) : string
{
    return ['rgb(',')'].join([col.red,col.green,col.blue].join(','));
}

/*
   For shapes that can be considered to have a bounding box, finds if point is
   within it
*/
function inBounds(point : Point, p0 : Point, p1:Point) : boolean
{
    var [smaller,bigger] = swapSmaller(p0,p1);
    return point.x >= smaller.x && point.x <= bigger.x  &&
           point.y >= smaller.y && point.y <= bigger.y;
}
/*
    Finds if a point intersects a shape. Used to select shapes for dragging or
    deletion
    Simple mathematical attributes of the shapes used, except for lines, which
    have a 'halo' of 5 pixels on either side of their constituent points, since
    the 1px wide shape itself would be really hard to select.
*/
function intersects( point : Point, shape : Shape ) : boolean
{
    switch(shape.kind){
        case 'Circle':
            var dx : number = point.x - shape.centre.x;
            var dy : number = point.y - shape.centre.y;
            return Math.pow(dx,2) + Math.pow(dy,2) <= Math.pow(shape.radius,2);
        case 'Square':
            var tl = { x:shape.centre.x - shape.width,
                       y:shape.centre.y - shape.height},
                br = { x:shape.centre.x + shape.width,
                       y:shape.centre.y + shape.height}
            return inBounds(point,tl,br);
        case 'Text':
            var other = { x : shape.centre.x + shape.width
                        , y : shape.centre.y - parseInt(shape.font)}
            return inBounds(point,shape.centre,other);
        case 'Line':
            return inBounds(point,shape.centre,shape.other)
                        && undefined !== shape.points.find((p : Point) => {
                            return p.y <= point.y+5 && p.y >= point.y -5 &&
                                   p.x <= point.x+5 && p.x >= point.x -5;
                        });
        default:
            return false;
    }
}
/*
    Draws a particular shape on the given context. Index is used to paint a
    shape gold if it's selected.
*/
function drawShape( context : CanvasRenderingContext2D,
                    shape : Shape,
                    i : number) : void
{
    if(this.shapeSelected && i == this.selected[0])
        context.strokeStyle = 'gold';
    else
        context.strokeStyle=toCSSColour(shape.colour);
    context.beginPath();

    var coords = shape.centre;

    switch(shape.kind){
        case 'Circle':
            context.arc(coords.x, coords.y, shape.radius, 0, 2*Math.PI);
            break;
        case 'Square':
            context.rect(coords.x-Math.round(shape.width/2),
                         coords.y-Math.round(shape.height/2),
                         shape.width, shape.height);
            break;
        case 'Text':
            context.font = shape.font;
            context.textAlign='left';
            context.fillText(shape.contents,coords.x,coords.y);
            break;
        case 'Line':
            context.moveTo(coords.x,coords.y);
            context.lineTo(shape.other.x, shape.other.y);

            /*
                Paints an arrowhead on appropriate lines. Finds the angle of
                the line using atan2, with the atan2(0,0) = undefined being
                ignored since this is an impossible with how lines are created
                initially.

            */
            if( shape.hasArrow ){
                // Arrowhead
                var dy = shape.other.y - coords.y;
                var dx = shape.other.x - coords.x;
                var lineAngle = Math.atan2(dy,dx);
                // Angle of each side of the arrowhead
                var theta = Math.PI/8;
                // Length of the head
                var h = Math.abs(10/Math.cos(theta));
                // Relative angles of the two head lines
                var topAngle = Math.PI + lineAngle + theta,
                    botAngle = Math.PI + lineAngle - theta;

                // The points that define the other end of the head line
                var topLine = { x : shape.other.x + Math.cos(topAngle) * h
                              , y : shape.other.y + Math.sin(topAngle) * h},
                    botLine = { x : shape.other.x + Math.cos(botAngle) * h
                              , y : shape.other.y + Math.sin(botAngle) * h};
                /*
                   Draw top line,
                   Move back to end of main line
                   Draw bottom line
                 */
                context.lineTo(topLine.x, topLine.y);
                context.moveTo(shape.other.x, shape.other.y);
                context.lineTo(botLine.x, botLine.y);
            }
            break;
    }

    context.stroke();
    context.closePath();
}
/*
    Stores a set of shapes, as well as incorporating functions to move, select
    and delete shapes.
*/
class CanvasState{
    private shapes : Shape[];
    private shapeSelected : boolean;
    selected : [number,Shape];
    // required to move lines
    private creatingLine : boolean;
    private startPoint ?: Point;

    constructor( public width : number,
                 public height : number,
                 shapes ?: Shape[]){
        this.shapes = shapes || [];
        this.shapeSelected = false;
        this.creatingLine = false;
    }
    // Adds a shape to maintained list
    addShape(shape:Shape) : void
    {
        this.shapes.push(shape);
    }
    /*
       Replaces a particular shape in a point in the list. Checks that bounds
       are valid, failing silently if they aren't.
    */
    replaceShape( index : number, shape:Shape ) : void
    {
        if( index >= 0 && index < this.shapes.length ){
            this.shapes[index] = shape;
        }
    }
    /*
        Deletes the currently selected shape
    */
    deleteShape() : void
    {
        if(this.shapeSelected)
        {
            this.shapes.splice(this.selected[0],1);
            this.shapeSelected = false;
        }
    }
    /*
        Sets the currently selected shape, by checking intersections with the
        incident point.

        If the point doesn't intersect, no change happend, if it intersects,
        the shape and its index are stored, as well as a boolean indicator that
        a shape is selected.
    */
    setSelectedShape( click : Point ) : void
    {
        this.startPoint = click;
        var index : number = this.shapes.findIndex(intersects.bind(null,click));
        if( index == -1)
            this.shapeSelected = false;
        else{
            this.shapeSelected = true;
            this.selected = [index, this.shapes[index]];
        }
    }
    /*
        Moves a shape, corresponding to the incident point. For simple shapes
        such as circles or squares, simply move the shape to that point.

        For lines there are two cases, the first being during the creation of a
        line, where one end of the line is assigned to the coord, the other
        case being a moved line, where the whole line is shifted by the delta
        with the last incident coord.
    */
    moveShape( coord : Point ): void
    {
        if(this.shapeSelected){
            if(this.selected[1].kind=='Line' && this.creatingLine){
                (<Line> this.selected[1]).other = coord;
            }
            else if(this.selected[1].kind=='Line' && this.startPoint){
                var diff : Point= difference(this.startPoint, coord);

                var line : Line= <Line> this.selected[1];
                line.centre = add(line.centre,diff);
                line.other  = add(line.other,diff);
                this.selected[1] = line;

                this.startPoint = coord;
            }
            else
                this.selected[1].centre = coord;

            this.replaceShape(this.selected[0],this.selected[1]);
        }
    }
    // Returns full list of shapes
    getShapes() : Shape[]
    {
        return this.shapes;
    }

    // Draws all the shapes onto the proferred context
    redrawAll( ctx : CanvasRenderingContext2D ): void
    {
        ctx.clearRect(0, 0, this.width, this.height);
        this.shapes.map(drawShape.bind(this,ctx));
    }
    /*
        When dragging a line, certain state needs to be maintained. This
        removes that state, and is called on mouseup by the canvas controller
    */
    endDrag() : void
    {
        if(this.selected && this.selected[1].kind== 'Line'){
            var line : Line = <Line> this.selected[1];
            line.points = breshenham(line.centre, line.other);
            this.replaceShape(this.selected[0],line);
        }
        this.creatingLine = false;
    }

    /*
        Creates a line object, as well as indicating it selected. This is due
        to the fact that lines are created through dragging, anomolous amongst
        the supported shapes.
    */
    createAndSelectLine(shape : ShapeFeatures, isArrow : boolean) : void
    {
        var line = <Line> shape;
        line.kind = 'Line';
        line.other = shape.centre;
        line.hasArrow = isArrow;
        this.creatingLine = true;
        this.addShape(line)
        this.selected = [this.shapes.length-1, line];
        this.shapeSelected = true;
    }
    /*
        Returns the URL of the image corresponding to the shapes saved. Optional
        parameter of a canvas, omission of which causes a hidden canvas to be
        created before drawing.

        URI is created by drawing the shapes onto a canvas before outputting
        that canvas.asDataURL() method
    */
    imageURL(can ?: HTMLCanvasElement) : string
    {
        if(can === undefined){
            can = document.createElement('canvas');
            can.width = this.width;
            can.height = this.height;
        }
        this.redrawAll(can.getContext('2d'));
        return can.toDataURL();
    }

}
