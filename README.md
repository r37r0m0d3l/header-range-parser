# Header • Range • Parser

Range header field parser. Fork of a̶b̶a̶n̶d̶o̶n̶e̶d̶ [range-parser](https://github.com/jshttp/range-parser). If you write to me with a request to change or update something, I will do it. Honestly 👼.

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![TypeScript Typings][ts-img]][ts-url]
[![Node.js Version][node-image]][node-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]


Range header field parser.

## Installation

```sh
$ npm install header-range-parser
```

## API

<!-- eslint-disable no-unused-vars -->

```js
const { parseRange } = require("header-range-parser");
```

```typescript
import {
  ERROR_INVALID_ARGUMENT,
  ERROR_STRING_IS_NOT_HEADER,
  ERROR_UNSATISFIABLE_RESULT,
  ResultInvalid,
  ResultUnsatisfiable,
  ResultWrongArgument,
  parseRange,
} from "header-range-parser";
```

### parseRange(size, header, options)

Parse the given `header` string where `size` is the size of the selected
representation that is to be partitioned into sub-ranges. An array of sub-ranges
will be returned or negative numbers indicating an error parsing.

- `-1` or `ERROR_UNSATISFIABLE_RESULT` or ` esultUnsatisfiable` signals an unsatisfiable range
- `-2` or `ERROR_STRING_IS_NOT_HEADER` or `ResultInvalid` signals a malformed header string
- `-3` or `ERROR_INVALID_ARGUMENT` or `ResultWrongArgument` invalid parameters

<!-- eslint-disable no-undef -->

```js
// parse header from request
const subRanges = parseRange(size, request.headers.range);

// the type of the subranges
if (subRanges.type === "bytes") {
  // the ranges
  subRanges.forEach((range) => {
    // do something with range.start and range.end
  });
}
```

#### Options

These properties are accepted in the options object.

##### combine

Specifies if overlapping and adjacent sub-ranges should be combined, defaults to `false`.

When `true`, ranges will be combined and returned as if they were specified that way in the header.

##### throwError

Throw or suppress errors. Defaults to `true`.

<!-- eslint-disable no-undef -->

```js
parseRange(
  100,
  "bytes=50-55,0-10,5-10,56-60",
  { combine: true, throwError: false });
// => [
//      { start: 0,  end: 10 },
//      { start: 50, end: 60 }
//    ]
```

[coveralls-image]: https://badgen.net/coveralls/c/github/jshttp/header-range-parser/master
[coveralls-url]: https://coveralls.io/r/r37r0m0d3l/header-range-parser?branch=master
[node-image]: https://badgen.net/npm/node/header-range-parser
[node-url]: https://nodejs.org/en/download
[npm-downloads-image]: https://badgen.net/npm/dm/header-range-parser
[npm-url]: https://npmjs.org/package/header-range-parser
[npm-version-image]: https://badgen.net/npm/v/header-range-parser
[travis-image]: https://badgen.net/travis/r37r0m0d3l/header-range-parser/master
[travis-url]: https://travis-ci.org/r37r0m0d3l/header-range-parser
[ts-url]: https://github.com/r37r0m0d3l/header-range-parser/blob/master/index.d.ts
[ts-img]: https://badgen.net/npm/types/r37r0m0d3l/header-range-parser?&icon=typescript&label=types&color=1E90FF
