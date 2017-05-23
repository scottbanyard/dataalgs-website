"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function swapSmaller(p0, p1) {
    return [{ x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y) },
        { x: Math.max(p0.x, p1.x), y: Math.max(p0.y, p1.y) }];
}
exports.swapSmaller = swapSmaller;
function difference(p, p1) {
    return { x: p1.x - p.x, y: p1.y - p.y };
}
exports.difference = difference;
function add(p, p1) {
    return { x: p.x + p1.x, y: p.y + p1.y };
}
exports.add = add;
function negX(p) {
    return { x: -p.x, y: p.y };
}
exports.negX = negX;
function negY(p) {
    return { x: p.x, y: -p.y };
}
exports.negY = negY;
function negBoth(p) {
    return { x: -p.x, y: -p.y };
}
exports.negBoth = negBoth;
function swap(p) {
    return { x: p.y, y: p.x };
}
exports.swap = swap;
