"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Point_1 = require("./Point");
function breshenham(p0, p1) {
    var oct = octant(p0, p1);
    var [p0, p1] = pointsToOctZero(oct, p0, p1);
    var dx = p1.x - p0.x;
    var dy = p1.y - p0.y;
    if (dx == 0) {
        var yMin = Math.round(Math.min(p0.y, p1.y));
        return Array.from({ length: Math.round(dy) }, (_, i) => ({ x: p1.x, y: yMin + i }));
    }
    var grad = Math.abs(dy / dx), error = grad - 0.5;
    var point = { x: p0.x, y: p0.y };
    return Array.from({ length: Math.round(Math.abs(dx)) }, (_, i) => {
        var currPoint = point;
        point.x += 1;
        error = error + grad;
        if (error >= 0.5) {
            point.y += 1;
            error -= 1;
        }
        return pointFromOctZero(oct, { x: currPoint.x, y: currPoint.y });
    });
}
exports.breshenham = breshenham;
function octant(p0, p1) {
    var dy = p1.y - p0.y;
    var dx = p1.x - p0.x;
    var theta = Math.atan2(dy, dx);
    theta = theta < 0 ? 2 * Math.PI + theta : theta;
    return Math.round(theta / (Math.PI / 4));
}
function pointsToOctZero(oct, p0, p1) {
    switch (oct) {
        case 1:
            return [p0, p1].map(Point_1.swap);
        case 2:
            return [p0, p1].map((p) => Point_1.negY(Point_1.swap(p)));
        case 3:
            return [p0, p1].map(Point_1.negX);
        case 4:
            return [p0, p1].map(Point_1.negBoth);
        case 5:
            return [p0, p1].map((p) => Point_1.negBoth(Point_1.swap(p)));
        case 6:
            return [p0, p1].map((p) => Point_1.negX(Point_1.swap(p)));
        case 7:
            return [p0, p1].map(Point_1.negY);
        default:
            return [p0, p1];
    }
}
function pointFromOctZero(oct, p) {
    switch (oct) {
        case 0:
            return p;
        case 1:
            return Point_1.swap(p);
        case 2:
            return Point_1.negX(Point_1.swap(p));
        case 3:
            return Point_1.negX(p);
        case 4:
            return Point_1.negBoth(p);
        case 5:
            return Point_1.negBoth(Point_1.swap(p));
        case 6:
            return Point_1.negY(Point_1.swap(p));
        case 7:
            return Point_1.negY(p);
    }
}
