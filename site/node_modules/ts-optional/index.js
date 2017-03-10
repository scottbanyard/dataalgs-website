var Nil = (function () {
    function Nil() {
        this.isNil = true;
    }
    Nil.prototype.valueOf = function () {
        return undefined;
    };
    return Nil;
}());
(global || window).nil = new Nil();
Object.prototype.isNil = false;
