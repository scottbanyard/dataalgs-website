function swapSmaller(p0, p1) {
    return [{ x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y) },
        { x: Math.max(p0.x, p1.x), y: Math.max(p0.y, p1.y) }];
}
function difference(p, p1) {
    return { x: p1.x - p.x, y: p1.y - p.y };
}
function add(p, p1) {
    return { x: p.x + p1.x, y: p.y + p1.y };
}
function negX(p) {
    return { x: -p.x, y: p.y };
}
function negY(p) {
    return { x: p.x, y: -p.y };
}
function negBoth(p) {
    return { x: -p.x, y: -p.y };
}
function swap(p) {
    return { x: p.y, y: p.x };
}
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
function octant(p0, p1) {
    var dy = p1.y - p0.y;
    var dx = p1.x - p0.x;
    var theta = Math.atan2(dy, dx);
    theta = theta < 0 ? 2 * Math.PI + theta : theta;
    return Math.floor(theta / (Math.PI / 4));
}
function pointsToOctZero(oct, p0, p1) {
    switch (oct) {
        case 1:
            return [p0, p1].map(swap);
        case 2:
            return [p0, p1].map((p) => negY(swap(p)));
        case 3:
            return [p0, p1].map(negX);
        case 4:
            return [p0, p1].map(negBoth);
        case 5:
            return [p0, p1].map((p) => negBoth(swap(p)));
        case 6:
            return [p0, p1].map((p) => negX(swap(p)));
        case 7:
            return [p0, p1].map(negY);
        default:
            return [p0, p1];
    }
}
function pointFromOctZero(oct, p) {
    switch (oct) {
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
function toCSSColour(col) {
    return ['rgb(', ')'].join([col.red, col.green, col.blue].join(','));
}
function inBounds(point, p0, p1) {
    var [smaller, bigger] = swapSmaller(p0, p1);
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
            return point.x >= shape.centre.x - shape.width &&
                point.x <= shape.centre.x + shape.width &&
                point.y >= shape.centre.y - shape.height &&
                point.y <= shape.centre.y + shape.height;
        case 'Text':
            var other = { x: shape.centre.x + shape.width,
                y: shape.centre.y - parseInt(shape.font) };
            return inBounds(point, shape.centre, other);
        case 'Line':
            return inBounds(point, shape.centre, shape.other)
                && undefined !== shape.points.find((p) => p && p.y <= point.y + 5 && p.y >= point.y - 5 &&
                    p.x <= point.x + 5 && p.x >= point.x - 5);
        default:
            return false;
    }
}
function getArrowPoints(line) {
    var dy = line.other.y - line.centre.y;
    var dx = line.other.x - line.centre.x;
    var lineAngle = Math.atan2(dy, dx);
    var theta = Math.PI / 8;
    var h = Math.abs(10 / Math.cos(theta));
    var topAngle = Math.PI + lineAngle + theta, botAngle = Math.PI + lineAngle - theta;
    var topLine = { x: line.other.x + Math.cos(topAngle) * h,
        y: line.other.y + Math.sin(topAngle) * h }, botLine = { x: line.other.x + Math.cos(botAngle) * h,
        y: line.other.y + Math.sin(botAngle) * h };
    return [topLine, botLine];
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
                var [topLine, botLine] = getArrowPoints(shape);
                context.lineTo(topLine.x, topLine.y);
                context.moveTo(shape.other.x, shape.other.y);
                context.lineTo(botLine.x, botLine.y);
            }
            break;
    }
    context.stroke();
    context.closePath();
}
function addBreshenham(shape) {
    if (shape.kind == "Line" && shape.points != []) {
        shape.points = breshenham(shape.centre, shape.other);
        if (shape.hasArrow) {
            var [topPoints, botPoints] = getArrowPoints(shape).map((p) => breshenham(shape.other, p));
            shape.points = shape.points.concat(topPoints, botPoints);
        }
    }
    return shape;
}
function removeBreshenham(shape) {
    if (shape.kind == 'Line')
        shape.points = [];
    return shape;
}
class CanvasState {
    constructor(width, height, shapes) {
        this.width = width;
        this.height = height;
        if (shapes)
            this.shapes = shapes.map(addBreshenham);
        else
            this.shapes = [];
        this.shapeSelected = false;
        this.creatingLine = false;
    }
    addShape(shape) {
        this.shapes.push(shape);
        this.shapeSelected = true;
        this.selected = [this.shapes.length - 1, shape];
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
                var diff = difference(this.startPoint, coord);
                var line = this.selected[1];
                line.centre = add(line.centre, diff);
                line.other = add(line.other, diff);
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
        if (this.selected) {
            this.replaceShape(this.selected[0], addBreshenham(this.selected[1]));
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
    toJSON() {
        var data = { width: this.width,
            height: this.height,
            shapes: this.shapes.map(removeBreshenham) };
        return JSON.stringify(data);
    }
}
