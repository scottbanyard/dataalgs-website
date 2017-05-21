function toCSSColour(col) {
    return ['rgb(', ')'].join([col.red, col.green, col.blue].join(','));
}
function intersects(point, shape) {
    switch (shape.kind) {
        case 'Circle':
            var dx = point.x - shape.centre.x;
            var dy = point.y - shape.centre.y;
            return Math.pow(dx, 2) + Math.pow(dy, 2) <= Math.pow(shape.radius, 2);
        case 'Rectangle':
            return point.x >= shape.centre.x - shape.width &&
                point.x <= shape.centre.x + shape.width &&
                point.y >= shape.centre.y - shape.height &&
                point.y <= shape.centre.y + shape.height;
        case 'Text':
            return point.x >= shape.centre.x &&
                point.x <= shape.centre.x + shape.width &&
                point.y >= shape.centre.y - parseInt(shape.font) &&
                point.y <= shape.centre.y;
        default:
            return false;
    }
}
class CanvasState {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.shapes = [];
        this.shapeSelected = false;
    }
    addShape(shape) {
        this.shapes.push(shape);
    }
    replaceShape(index, shape) {
        if (index >= 0 && index < this.shapes.length) {
            this.shapes[index] = shape;
        }
    }
    setSelectedShape(click) {
        var index = this.shapes.findIndex(intersects.bind(null, click));
        if (index == -1)
            this.shapeSelected = false;
        else {
            this.shapeSelected = true;
            this.selected = [index, this.shapes[index]];
        }
    }
    deselectShape() {
        this.shapeSelected = false;
        this.selected = null;
    }
    moveShape(coord) {
        if (this.shapeSelected) {
            if (this.selected[1].kind == 'Line')
                this.selected[1].other = coord;
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
        this.shapes.map(this.drawShape.bind(this, ctx));
    }
    drawShape(context, shape, i) {
        if (this.shapeSelected && i == this.selected[0])
            context.strokeStyle = 'gold';
        else
            context.strokeStyle = toCSSColour(shape.colour);
        context.beginPath();
        var coords = shape.centre;
        if (shape.kind == 'Circle') {
            context.arc(coords.x, coords.y, shape.radius, 0, 2 * Math.PI);
        }
        else if (shape.kind == 'Rectangle') {
            context.rect(coords.x - Math.round(shape.width / 2), coords.y - Math.round(shape.height / 2), shape.width, shape.height);
        }
        else if (shape.kind == 'Text') {
            context.font = shape.font;
            context.textAlign = 'left';
            context.fillText(shape.contents, coords.x, coords.y);
        }
        else if (shape.kind == 'Line') {
            context.moveTo(shape.centre.x, shape.centre.y);
            context.lineTo(shape.other.x, shape.other.y);
        }
        context.stroke();
        context.closePath();
    }
    createAndSelectLine(shape) {
        var line = shape;
        line.other = shape.centre;
        this.addShape(line);
        this.selected = [this.shapes.length - 1, line];
        this.shapeSelected = true;
    }
}
