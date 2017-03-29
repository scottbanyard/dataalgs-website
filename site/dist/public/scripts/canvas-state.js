function toCSSColour(col) {
    return ['rgb(', ')'].join([col.red, col.green, col.blue].join(','));
}
function intersects(point, shape) {
    if (shape.kind == 'Circle') {
        var dx = point.x - shape.centre.y;
        var dy = point.y - shape.centre.y;
        return (dx ^ 2 + dy ^ 2) <= (shape.radius ^ 2);
    }
    else if (shape.kind == 'Rectangle') {
        return point.x >= shape.centre.x - shape.width &&
            point.x <= shape.centre.x + shape.width &&
            point.y >= shape.centre.y - shape.height &&
            point.y <= shape.centre.y + shape.height;
    }
}
class CanvasState {
    constructor() {
        this.shapes = [];
    }
    addShape(shape) {
        this.shapes.push(shape);
    }
    replaceShape(index, shape) {
        if (index >= 0 && index < this.shapes.length) {
            this.shapes[index] = shape;
        }
    }
    selectedShape(click) {
        var index = this.shapes.findIndex(intersects.bind(click));
        this.selected = index;
        if (index == -1)
            return nil;
        else
            return [index, this.shapes[index]];
    }
    getShapes() {
        return this.shapes;
    }
}
