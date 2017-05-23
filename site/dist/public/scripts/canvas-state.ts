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
    kind : 'Line';
    other : Point;
    hasArrow : boolean;
    points : Point[];
}
interface Circle extends ShapeFeatures {
    kind : 'Circle';
    radius : number;
}
interface Square extends ShapeFeatures {
    kind : 'Square';
    width : number;
    height : number;
}
interface Text extends ShapeFeatures {
    kind : 'Text';
    contents: string;
    font : string;
    width : number;
}
type Shape = Circle | Square | Text | Line

// Formats a Colour object into an rgb(r,g,b) string
function toCSSColour( col : Colour ) : string
{
    return ['rgb(',')'].join([col.red,col.green,col.blue].join(','));
}
function swapSmaller(p0 : Point, p1 : Point) : [Point,Point]
{
    return [{x: Math.min(p0.x,p1.x), y: Math.min(p0.y,p1.y)},
            {x: Math.max(p0.x,p1.x), y: Math.max(p0.y,p1.y)}]
}

function difference(p : Point, p1: Point ) : Point
{
    return {x: p1.x - p.x, y: p1.y-p.y};
}

function add(p : Point, p1: Point ) : Point
{
    return {x: p.x + p1.x, y: p.y+p1.y};
}

function inBounds(point : Point, p0 : Point, p1:Point) : boolean
{
    var [smaller,bigger] = swapSmaller(p0,p1);
    return point.x >= smaller.x && point.x <= bigger.x  &&
           point.y >= smaller.y && point.y <= bigger.y;
}
// Finds if a point intersects a shape
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

            if( shape.hasArrow ){
                // Arrowhead
                var dy = shape.other.y - coords.y;
                var dx = shape.other.x - coords.x;
                var lineAngle = Math.atan2(dy,dx);
                // Angle of each side of the arrowhead
                var theta = Math.PI/8;
                var h = Math.abs(10/Math.cos(theta));
                var topAngle = Math.PI + lineAngle + theta;
                var botAngle = Math.PI + lineAngle - theta;
                var topLine = { x : shape.other.x + Math.cos(topAngle) * h
                              , y : shape.other.y + Math.sin(topAngle) * h};
                var botLine = { x : shape.other.x + Math.cos(botAngle) * h
                              , y : shape.other.y + Math.sin(botAngle) * h};
                context.lineTo(topLine.x, topLine.y);
                context.moveTo(shape.other.x, shape.other.y);
                context.lineTo(botLine.x, botLine.y);
            }
            break;
    }

    context.stroke();
    context.closePath();
}
function octant(p0 : Point,p1 : Point) : number
{
    var dy = p1.y - p0.y;
    var dx = p1.x - p0.x;
    // Angle of slope in radians, in range [-Pi,Pi)
    var theta = Math.atan2(dy, dx);
    // Move this range to [0,2pi)
    theta = theta < 0 ? 2 * Math.PI + theta : theta;
    return Math.round(theta/ (Math.PI/4));
}
function negX(p : Point) : Point
{
    return {x : -p.x, y: p.y};
}
function negY(p : Point) : Point
{
    return {x : p.x, y: -p.y};
}
function negBoth(p : Point) : Point
{
    return {x : -p.x, y: -p.y};
}
function swap(p : Point) : Point
{
    return {x : p.y, y:p.x};
}
function pointsToOctZero(oct : number, p0 : Point,p1 : Point) : Point[]
{
    switch(oct){
        case 1:
            return [p0,p1].map(swap);
        case 2:
            return [p0,p1].map((p) => negY(swap(p)));
        case 3:
            return [p0,p1].map(negX);
        case 4:
            return [p0,p1].map(negBoth);
        case 5:
            return [p0,p1].map((p) => negBoth(swap(p)));
        case 6:
            return [p0,p1].map((p) => negX(swap(p)))
        case 7:
            return [p0,p1].map(negY)
        default:
            return [p0,p1];
    }
}
function pointFromOctZero(oct : number, p : Point) : Point
{
    switch(oct){
        case 0:
            return p;
        case 1:
            return swap(p);
        case 2:
            return negX(swap(p));
        case 3:
            return negX(p);
        case 4:
            return negBoth(p);
        case 5:
            return negBoth(swap(p));
        case 6:
            return negY(swap(p));
        case 7:
            return negY(p);
    }
}
function breshenham(p0 : Point, p1: Point) : Point[]
{
    var oct = octant(p0,p1);

    var [p0,p1] = pointsToOctZero(oct,p0,p1);

    var dx = p1.x - p0.x;
    var dy = p1.y - p0.y;
    // line is vertical
    if(dx == 0)
    {
        var yMin : number = Math.round(Math.min(p0.y,p1.y));
        return Array.from({length:Math.round(dy)},
                                (_,i) => ({x:p1.x, y:yMin+i}));
    }
    var grad = Math.abs(dy/dx) , error = grad - 0.5;
    var point = {x:p0.x,y:p0.y};
    return Array.from({length:Math.round(Math.abs(dx))},(_,i) =>{
        var currPoint = point;
        point.x+=1;
        error = error+grad;
        if( error >= 0.5){
            point.y +=1;
            error -=1;
        }
        return pointFromOctZero(oct,{x : currPoint.x, y:currPoint.y});
    });
}

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
        this.startPoint = click;
        var index : number = this.shapes.findIndex(intersects.bind(null,click));
        if( index == -1)
            this.shapeSelected = false;
        else{
            this.shapeSelected = true;
            this.selected = [index, this.shapes[index]];
        }
    }
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
    getShapes() : Shape[]
    {
        return this.shapes;
    }
    redrawAll( ctx : CanvasRenderingContext2D ): void
    {
        ctx.clearRect(0, 0, this.width, this.height);
        this.shapes.map(drawShape.bind(this,ctx));
    }
    endDrag() : void
    {
        if(this.selected && this.selected[1].kind== 'Line'){
            var line : Line = <Line> this.selected[1];
            line.points = breshenham(line.centre, line.other);
            this.replaceShape(this.selected[0],line);
        }
        this.creatingLine = false;
    }

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
    deleteShape() : void
    {
        if(this.shapeSelected)
        {
            this.shapes.splice(this.selected[0],1);
            this.shapeSelected = false;
        }
    }
}
