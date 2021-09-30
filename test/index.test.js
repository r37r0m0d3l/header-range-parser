const assert = require("assert");

const {
  ERROR_INVALID_ARGUMENT,
  ERROR_STRING_IS_NOT_HEADER,
  ERROR_UNSATISFIABLE_RESULT,
  HeaderRanges,
  parseRange,
} = require("../dist/index.cjs");

describe(`parseRange(size, header)`, function () {
  it(`Should create empty "HeaderRanges"`, function () {
    const headerRanges = new HeaderRanges();
    expect(headerRanges.length).toEqual(0);
    expect(headerRanges.type).toEqual("");
  });

  it(`Should reject non-number "size"`, function () {
    assert.throws(parseRange.bind("200", "bytes=40-80", {}), /Argument 'size' must be an integer./);
    assert.throws(parseRange.bind("200", "bytes=40-80", { throwError: true }), /Argument 'size' must be an integer./);
  });

  it(`Should reject non-integer "size"`, function () {
    assert.throws(parseRange.bind(200.555, "bytes=40-80", {}), /Argument 'size' must be an integer./);
    assert.throws(parseRange.bind(200.555, "bytes=40-80", { throwError: true }), /Argument 'size' must be an integer./);
  });

  it(`Should reject non-integer "size", but not emit error`, function () {
    assert.strictEqual(parseRange(200.555, "bytes=40-80", { throwError: false }), ERROR_INVALID_ARGUMENT);
  });

  it(`Should reject non-string "header"`, function () {
    assert.throws(parseRange.bind(null, 200, {}), /Argument 'header' must be a string./);
    assert.throws(parseRange.bind(null, 200, { throwError: true }), /Argument 'header' must be a string./);
  });

  it(`Should reject non-string "header", but not emit error`, function () {
    assert.strictEqual(parseRange(5, 200, { throwError: false }), ERROR_INVALID_ARGUMENT);
  });

  it(`Should return -2 "ERROR_STRING_IS_NOT_HEADER" for invalid "header"`, function () {
    assert.strictEqual(parseRange(200, "malformed"), ERROR_STRING_IS_NOT_HEADER);
  });

  it(`Should return -1 "ERROR_UNSATISFIABLE_RESULT" if all specified ranges are invalid`, function () {
    assert.strictEqual(parseRange(200, "bytes=500-20"), ERROR_UNSATISFIABLE_RESULT);
    assert.strictEqual(parseRange(200, "bytes=500-999"), ERROR_UNSATISFIABLE_RESULT);
    assert.strictEqual(parseRange(200, "bytes=500-999,1000-1499"), ERROR_UNSATISFIABLE_RESULT);
  });

  it(`Should parse "header"`, function () {
    const range = parseRange(1000, "bytes=0-499");
    assert.strictEqual(range.type, "bytes");
    assert.strictEqual(range.length, 1);
    expect(range[0]).toStrictEqual({ start: 0, end: 499 });
  });

  it(`Should cap end at "size"`, function () {
    const range = parseRange(200, "bytes=0-499");
    assert.strictEqual(range.type, "bytes");
    assert.strictEqual(range.length, 1);
    expect(range[0]).toStrictEqual({ start: 0, end: 199 });
  });

  it(`Should parse "header"`, function () {
    const range = parseRange(1000, "bytes=40-80");
    assert.strictEqual(range.type, "bytes");
    assert.strictEqual(range.length, 1);
    expect(range[0]).toStrictEqual({ start: 40, end: 80 });
  });

  it(`Should parse "header" and get plain array`, function () {
    const range = parseRange(1000, "bytes=40-80");
    assert.strictEqual(range.type, "bytes");
    assert.strictEqual(range.length, 1);
    expect(range.toArray()[0]).toStrictEqual({ start: 40, end: 80 });
    expect(Array.from(range)[0]).toStrictEqual({ start: 40, end: 80 });
    expect([...range][0]).toStrictEqual({ start: 40, end: 80 });
  });

  it(`Should parse "header" asking for last n bytes`, function () {
    const range = parseRange(1000, "bytes=-400");
    assert.strictEqual(range.type, "bytes");
    assert.strictEqual(range.length, 1);
    expect(range[0]).toStrictEqual({ start: 600, end: 999 });
  });

  it(`Should parse "header" with only start`, function () {
    const range = parseRange(1000, "bytes=400-");
    assert.strictEqual(range.type, "bytes");
    assert.strictEqual(range.length, 1);
    expect(range[0]).toStrictEqual({ start: 400, end: 999 });
  });

  it(`Should parse "bytes=0-"`, function () {
    const range = parseRange(1000, "bytes=0-");
    assert.strictEqual(range.type, "bytes");
    assert.strictEqual(range.length, 1);
    expect(range[0]).toStrictEqual({ start: 0, end: 999 });
  });

  it(`Should parse "header" with no bytes`, function () {
    const range = parseRange(1000, "bytes=0-0");
    assert.strictEqual(range.type, "bytes");
    assert.strictEqual(range.length, 1);
    expect(range[0]).toStrictEqual({ start: 0, end: 0 });
  });

  it(`Should parse "header" asking for last byte`, function () {
    const range = parseRange(1000, "bytes=-1");
    assert.strictEqual(range.type, "bytes");
    assert.strictEqual(range.length, 1);
    expect(range[0]).toStrictEqual({ start: 999, end: 999 });
  });

  it(`Should parse "header" with multiple ranges`, function () {
    const range = parseRange(1000, "bytes=40-80,81-90,-1");
    assert.strictEqual(range.type, "bytes");
    assert.strictEqual(range.length, 3);
    expect(range[0]).toStrictEqual({ start: 40, end: 80 });
    expect(range[1]).toStrictEqual({ start: 81, end: 90 });
    expect(range[2]).toStrictEqual({ start: 999, end: 999 });
  });

  it(`Should parse "header" with invalid ranges`, function () {
    const range = parseRange(200, "bytes=0-499,1000-,500-999");
    assert.strictEqual(range.type, "bytes");
    assert.strictEqual(range.length, 1);
    expect(range[0]).toStrictEqual({ start: 0, end: 199 });
  });

  it(`Should parse non-byte range`, function () {
    const range = parseRange(1000, "items=0-5");
    assert.strictEqual(range.type, "items");
    assert.strictEqual(range.length, 1);
    expect(range[0]).toStrictEqual({ start: 0, end: 5 });
  });

  describe(`When combine: true`, function () {
    it(`Should combine overlapping ranges`, function () {
      const range = parseRange(150, "bytes=0-4,90-99,5-75,100-199,101-102", { combine: true });
      assert.strictEqual(range.type, "bytes");
      assert.strictEqual(range.length, 2);
      expect(range[0]).toStrictEqual({ start: 0, end: 75 });
      expect(range[1]).toStrictEqual({ start: 90, end: 149 });
    });

    it(`Should retain original order`, function () {
      const range = parseRange(150, "bytes=-1,20-100,0-1,101-120", {
        combine: true,
      });
      assert.strictEqual(range.type, "bytes");
      assert.strictEqual(range.length, 3);
      expect(range[0]).toStrictEqual({ start: 149, end: 149 });
      expect(range[1]).toStrictEqual({ start: 20, end: 120 });
      expect(range[2]).toStrictEqual({ start: 0, end: 1 });
    });
  });
});
