// Point with x and y coordinates, expected to be in pixel space
export interface Point {
    x : number;
    y : number;
}

// Takes two points, returning their extrema: (minX,minY) (maxX,maxY)
export function swapSmaller(p0 : Point, p1 : Point) : [Point,Point]
{
    return [{x: Math.min(p0.x,p1.x), y: Math.min(p0.y,p1.y)},
            {x: Math.max(p0.x,p1.x), y: Math.max(p0.y,p1.y)}]
}
// Difference of two points
export function difference(p : Point, p1: Point ) : Point
{
    return {x: p1.x - p.x, y: p1.y-p.y};
}
// Addition of two points
export function add(p : Point, p1: Point ) : Point
{
    return {x: p.x + p1.x, y: p.y+p1.y};
}
// Negates a point's x value
export function negX(p : Point) : Point
{
    return {x : -p.x, y: p.y};
}
// Negates a point's y value
export function negY(p : Point) : Point
{
    return {x : p.x, y: -p.y};
}
// Negates both x and y in a point
export function negBoth(p : Point) : Point
{
    return {x : -p.x, y: -p.y};
}
// Swaps the Point's x and y values around
export function swap(p : Point) : Point
{
    return {x : p.y, y:p.x};
}
