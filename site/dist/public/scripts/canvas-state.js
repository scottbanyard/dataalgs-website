"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Point_1 = require("./Point");
const Breshenham_1 = require("./Breshenham");
function toCSSColour(col) {
    return ['rgb(', ')'].join([col.red, col.green, col.blue].join(','));
}
function inBounds(point, p0, p1) {
    var [smaller, bigger] = Point_1.swapSmaller(p0, p1);
    return point.x >= smaller.x && point.x <= bigger.x &&
        point.y >= smaller.y && point.y <= bigger.y;
}
function intersects(point, shape) {
    switch (shape.kind) {
        case 'Circle':
            var dx = point.x - shape.centre.x;
            var dy = point.y - shape.centre.y;
            return Math.pow(dx, 2) + Math.pow(dy, 2) <= Math.pow(shape.radius, 2);
        case 'Square':
            var tl = { x: shape.centre.x - shape.width,
                y: shape.centre.y - shape.height }, br = { x: shape.centre.x + shape.width,
                y: shape.centre.y + shape.height };
            return inBounds(point, tl, br);
        case 'Text':
            var other = { x: shape.centre.x + shape.width,
                y: shape.centre.y - parseInt(shape.font) };
            return inBounds(point, shape.centre, other);
        case 'Line':
            return inBounds(point, shape.centre, shape.other)
                && undefined !== shape.points.find((p) => {
                    return p.y <= point.y + 5 && p.y >= point.y - 5 &&
                        p.x <= point.x + 5 && p.x >= point.x - 5;
                });
        default:
            return false;
    }
}
function drawShape(context, shape, i) {
    if (this.shapeSelected && i == this.selected[0])
        context.strokeStyle = 'gold';
    else
        context.strokeStyle = toCSSColour(shape.colour);
    context.beginPath();
    var coords = shape.centre;
    switch (shape.kind) {
        case 'Circle':
            context.arc(coords.x, coords.y, shape.radius, 0, 2 * Math.PI);
            break;
        case 'Square':
            context.rect(coords.x - Math.round(shape.width / 2), coords.y - Math.round(shape.height / 2), shape.width, shape.height);
            break;
        case 'Text':
            context.font = shape.font;
            context.textAlign = 'left';
            context.fillText(shape.contents, coords.x, coords.y);
            break;
        case 'Line':
            context.moveTo(coords.x, coords.y);
            context.lineTo(shape.other.x, shape.other.y);
            if (shape.hasArrow) {
                var dy = shape.other.y - coords.y;
                var dx = shape.other.x - coords.x;
                var lineAngle = Math.atan2(dy, dx);
                var theta = Math.PI / 8;
                var h = Math.abs(10 / Math.cos(theta));
                var topAngle = Math.PI + lineAngle + theta, botAngle = Math.PI + lineAngle - theta;
                var topLine = { x: shape.other.x + Math.cos(topAngle) * h,
                    y: shape.other.y + Math.sin(topAngle) * h }, botLine = { x: shape.other.x + Math.cos(botAngle) * h,
                    y: shape.other.y + Math.sin(botAngle) * h };
                context.lineTo(topLine.x, topLine.y);
                context.moveTo(shape.other.x, shape.other.y);
                context.lineTo(botLine.x, botLine.y);
            }
            break;
    }
    context.stroke();
    context.closePath();
}
class CanvasState {
    constructor(width, height, shapes) {
        this.width = width;
        this.height = height;
        this.shapes = shapes || [];
        this.shapeSelected = false;
        this.creatingLine = false;
    }
    addShape(shape) {
        this.shapes.push(shape);
    }
    replaceShape(index, shape) {
        if (index >= 0 && index < this.shapes.length) {
            this.shapes[index] = shape;
        }
    }
    deleteShape() {
        if (this.shapeSelected) {
            this.shapes.splice(this.selected[0], 1);
            this.shapeSelected = false;
        }
    }
    setSelectedShape(click) {
        this.startPoint = click;
        var index = this.shapes.findIndex(intersects.bind(null, click));
        if (index == -1)
            this.shapeSelected = false;
        else {
            this.shapeSelected = true;
            this.selected = [index, this.shapes[index]];
        }
    }
    moveShape(coord) {
        if (this.shapeSelected) {
            if (this.selected[1].kind == 'Line' && this.creatingLine) {
                this.selected[1].other = coord;
            }
            else if (this.selected[1].kind == 'Line' && this.startPoint) {
                var diff = Point_1.difference(this.startPoint, coord);
                var line = this.selected[1];
                line.centre = Point_1.add(line.centre, diff);
                line.other = Point_1.add(line.other, diff);
                this.selected[1] = line;
                this.startPoint = coord;
            }
            else
                this.selected[1].centre = coord;
            this.replaceShape(this.selected[0], this.selected[1]);
        }
    }
    getShapes() {
        return this.shapes;
    }
    redrawAll(ctx) {
        ctx.clearRect(0, 0, this.width, this.height);
        this.shapes.map(drawShape.bind(this, ctx));
    }
    endDrag() {
        if (this.selected && this.selected[1].kind == 'Line') {
            var line = this.selected[1];
            line.points = Breshenham_1.breshenham(line.centre, line.other);
            this.replaceShape(this.selected[0], line);
        }
        this.creatingLine = false;
    }
    createAndSelectLine(shape, isArrow) {
        var line = shape;
        line.kind = 'Line';
        line.other = shape.centre;
        line.hasArrow = isArrow;
        this.creatingLine = true;
        this.addShape(line);
        this.selected = [this.shapes.length - 1, line];
        this.shapeSelected = true;
    }
    imageURL(can) {
        if (can === undefined) {
            can = document.createElement('canvas');
            can.width = this.width;
            can.height = this.height;
        }
        this.redrawAll(can.getContext('2d'));
        return can.toDataURL();
    }
}
