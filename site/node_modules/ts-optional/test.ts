/// <reference path="index.d.ts" />

declare function require(m: string): void

require("./index.js")

function assert(condition: boolean) {
  if (!condition) throw 'Assertion failed'
}

// Equality
assert(nil === nil)
assert(nil !== "string")
assert(nil !== 123)

assert(nil.isNil)
assert("".isNil === false)
assert((1).isNil === false)

var optional: Optional<string>

optional = ""
optional = nil

assert(optional == nil)
