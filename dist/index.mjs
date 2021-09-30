// src/index.ts
var ERROR_INVALID_ARGUMENT = -3;
var ERROR_STRING_IS_NOT_HEADER = -2;
var ERROR_UNSATISFIABLE_RESULT = -1;
function combineRanges(ranges) {
  const ordered = ranges.map(mapWithIndex).sort(sortByRangeStart);
  let order = 0;
  for (let index = 1; index < ordered.length; index++) {
    const range = ordered[index];
    const current = ordered[order];
    if (range.start > current.end + 1) {
      ordered[++order] = range;
    } else if (range.end > current.end) {
      current.end = range.end;
      current.index = Math.min(current.index, range.index);
    }
  }
  ordered.length = order + 1;
  const combined = ordered.sort(sortByRangeIndex).map(mapWithoutIndex);
  combined.type = ranges.type;
  return combined;
}
function mapWithIndex(range, index) {
  return { end: range.end, index, start: range.start };
}
function mapWithoutIndex(range) {
  return { end: range.end, start: range.start };
}
function sortByRangeIndex(alpha, beta) {
  return alpha.index - beta.index;
}
function sortByRangeStart(alpha, beta) {
  return alpha.start - beta.start;
}
var HeaderRanges = class extends Array {
  constructor() {
    super(...arguments);
    this.type = "";
  }
  toArray() {
    const array = Array.from(this);
    array.type = this.type;
    return array;
  }
};
function parseRange(size, header, options) {
  let throwError = true;
  if (options && "throwError" in options && options.throwError === false) {
    throwError = false;
  }
  if (!Number.isInteger(size)) {
    if (throwError) {
      throw new TypeError(`Argument 'size' must be an integer.`);
    } else {
      return ERROR_INVALID_ARGUMENT;
    }
  }
  if (!(typeof header === "string")) {
    if (throwError) {
      throw new TypeError(`Argument 'header' must be a string.`);
    } else {
      return ERROR_INVALID_ARGUMENT;
    }
  }
  const index = header.indexOf("=");
  if (index === -1) {
    return ERROR_STRING_IS_NOT_HEADER;
  }
  const strings = header.slice(index + 1).split(",");
  const ranges = new HeaderRanges();
  ranges.type = header.slice(0, index);
  for (let index2 = 0; index2 < strings.length; index2++) {
    const range = strings[index2].split("-");
    let start = Number.parseInt(range[0], 10);
    let end = Number.parseInt(range[1], 10);
    if (Number.isNaN(start)) {
      start = size - end;
      end = size - 1;
    } else if (Number.isNaN(end)) {
      end = size - 1;
    }
    if (end > size - 1) {
      end = size - 1;
    }
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start < 0) {
      continue;
    }
    ranges.push({ end, start });
  }
  if (ranges.length < 1) {
    return ERROR_UNSATISFIABLE_RESULT;
  }
  return options && options.combine ? combineRanges(ranges) : ranges;
}
export {
  ERROR_INVALID_ARGUMENT,
  ERROR_STRING_IS_NOT_HEADER,
  ERROR_UNSATISFIABLE_RESULT,
  HeaderRanges,
  parseRange
};
