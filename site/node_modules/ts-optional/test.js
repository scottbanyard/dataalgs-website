require("./index.js");
function assert(condition) {
    if (!condition)
        throw 'Assertion failed';
}
assert(nil === nil);
assert(nil !== "string");
assert(nil !== 123);
assert(nil.isNil);
assert("".isNil === false);
assert((1).isNil === false);
var optional;
optional = "";
optional = nil;
assert(optional == nil);
