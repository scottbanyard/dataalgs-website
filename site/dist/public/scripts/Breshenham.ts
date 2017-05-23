import {Point, swap, negX, negY, negBoth } from './Point';
/*
    Breshenham's line algorithm, described fully here:
        https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm

    This an algorithm that finds the list of individual pixels that make up a
    line that is drawn onto the canvas. This list of pixels is used when finding
    the intersection of a point with a Line object.

    Works by rasterising between two points, using an error differential to
    adjust for overlaps being not permitted. Only works in one octant of a
    circle (with the line within a particular range of angles), and so in order
    to support lines of any angle, it is required to shift a line into and out
    of this 'zero' octant before and after interpolation.
*/
export function breshenham(p0 : Point, p1: Point) : Point[]
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
/*
    Which octant of a circle (with its origin at one of the points) the line
    sits within. Using atan2, with the atan2(0,0) == undefined case not dealt
    with, since the Line objects that the points are derived from can't have
    a dy and dx value of 0,0.

    Each octant is a circle is within a range of PI/4, and the atan2 output is
    shifted to the range [0,2PI) rather than [-Pi,Pi) as is more traditional,
    so as to enable octant selected through rounding.
*/
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
/*
    Shifts a pair of points to octant zero. Uses operations as described
    in Breshenham algorithm
*/
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
// Shifts a point from octant zero to the specified octant
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
