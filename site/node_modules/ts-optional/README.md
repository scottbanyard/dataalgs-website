# ts-optional

In TypeScript, like in JavaScript, every value is nullable. However, sometimes you want to prevent
the caller from sending a null value. You might end up with something like this:

```typescript
function(value: Type) {
  if (!value) {
    throw "value can not be null!"
  }
  ...
}
```

However, sometimes a `null` value is valid and expected. There is no way to enforce this in
TypeScript, so you would resort to a comment:

```typescript
// Returns null if the source string is not a valid number
function parseIfNumber(source: string): number { ... }
```

With this library, optional values are explicit and enforced by the TypeScript compiler. All you
need to do is start using `nil` instead of `null`, and annotating optional values with `Optional`.

### Installation

``` shell
> npm install --save ts-optional
```

Optionals are attached to the global object and uses Monkey Patching to extend the behaviour of
the global Object prototype. Depending on your platform you must execute the `index.js` file before
running the TypeScript code.

#### Directly in a script tag
```html
<script src="node_modules/ts-optional/index.js"></script>
<script src="my_compiled_typescript.js"></script>
```

Where the TypeScript source file would contain
`/// <reference path="node_modules/ts-optional/index.d.ts" />`.

#### Using Node or Browserify (CommonJS)
Put this in the head of the TypeScript source file.
```typescript
/// <reference path="node_modules/ts-optional/index.d.ts" />
require("ts-optional")
```

### Usage

```typescript
function parseIfNumber(source: string): Optional<number> {
  if (/^\d+$/.test(source)) {
    return parseInt(source)
  } else if (/^\d*\.\d+$/.test(source)) {
    return parseFloat(source)
  } else {
    return nil
  }
}

parseIfNumber("not a number").valueOf() || 0  // 0
parseIfNumber("123").valueOf() || 0           // 123
parseIfNumber(".1").valueOf() || 0            // 0.1

parseIfNumber("not a number")                 // nil
parseIfNumber("123")                          // 123

// All objects are optionals
"string".valueOf() || "default"               // "string"

var optional: Optional<string>
var nonOptional: string

nonOptional = 123
//            ^^^ number cannot be assigned to string

optional = 123
//         ^^^ number cannot be assigned to Optional<string>

nonOptional = "string" // Valid
optional = "string"    // Also valid

nonOptional = nil
//            ^^^ Optional<any> cannot be assigned to string
optional = nil         // Valid
```

Unwrap an optional by using `isNil` and `valueOf()`.

```typescript
const maybeNumber = parseIfNumber(someString)

if (maybeNumber.isNil) {
  // Handle degenerate case
} else {
  const number = maybeNumber.valueOf()
  // or cast
  const number = <number>maybeNumber
}
```

The optional is not its own object, so casting works as well as equality checks.

```typescript
parseIfNumber("123") === 123 // true
parseIfNumber("not a number") === nil // true
parseIfNumber("123") === nil // false
```
