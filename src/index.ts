interface RangeWithIndex {
  end: number;
  index: number;
  start: number;
}

export interface Range {
  end: number;
  start: number;
}

export interface Options {
  /**
   * @description The "combine" option can be set to `true`
   * and overlapping & adjacent ranges
   * will be combined into a single range.
   */
  combine?: boolean;
  /**
   * @description Throw or suppress errors.
   */
  throwError?: boolean;
}

export type ResultUnsatisfiable = -1;

export type ResultInvalid = -2;

export type ResultWrongArgument = -3;

export type Result = ResultInvalid | ResultUnsatisfiable | ResultWrongArgument;

export const ERROR_INVALID_ARGUMENT: ResultWrongArgument = -3 as const;

export const ERROR_STRING_IS_NOT_HEADER: ResultInvalid = -2 as const;

export const ERROR_UNSATISFIABLE_RESULT: ResultUnsatisfiable = -1 as const;

/**
 * @description Combine overlapping & adjacent ranges.
 * @param {Ranges} ranges
 * @returns {Ranges}
 */
function combineRanges(ranges: Ranges): Ranges {
  const ordered = ranges.map(mapWithIndex).sort(sortByRangeStart);
  let order = 0;
  for (let index = 1; index < ordered.length; index++) {
    const range: RangeWithIndex = ordered[index];
    const current: RangeWithIndex = ordered[order];
    if (range.start > current.end + 1) {
      ordered[++order] = range;
    } else if (range.end > current.end) {
      current.end = range.end;
      current.index = Math.min(current.index, range.index);
    }
  }
  ordered.length = order + 1;
  const combined = [...ordered].sort(sortByRangeIndex).map(mapWithoutIndex) as Ranges;
  combined.type = ranges.type;
  return combined;
}

/**
 * @description Map function to add index value to ranges.
 * @param {RangeWithIndex} range
 * @param {number} index
 * @returns {RangeWithIndex}
 */
function mapWithIndex(range: Range | RangeWithIndex, index: number): RangeWithIndex {
  return { end: range.end, index, start: range.start };
}

/**
 * @description Map function to remove index value from ranges.
 * @param {RangeWithIndex} range
 * @returns {Range}
 */
function mapWithoutIndex(range: RangeWithIndex): Range {
  return { end: range.end, start: range.start };
}

/**
 * @description Sort function to sort ranges by index.
 * @param {RangeWithIndex} alpha
 * @param {RangeWithIndex} beta
 * @returns {number}
 */
function sortByRangeIndex(alpha: RangeWithIndex, beta: RangeWithIndex): number {
  return alpha.index - beta.index;
}

/**
 * @description Sort function to sort ranges by start position.
 * @param {Range} alpha
 * @param {Range} beta
 * @returns {number}
 */
function sortByRangeStart(alpha: Range, beta: Range): number {
  return alpha.start - beta.start;
}

export class Ranges extends Array<Range> {
  /**
   * @description Header name or type
   */
  public type = "";
  /**
   * @description Return plain JavaScript array with 'type' property
   * @returns {Array<Range>}
   */
  public toArray(): Array<Range> {
    const array = Array.from(this) as Ranges;
    array.type = this.type;
    return array;
  }
}

/**
 * @description Parse string to integer.
 * @param {string} str
 * @returns {number}
 */
function parsePos(str: string): number {
  if (/^\d+$/.test(str)) {
    return Number(str);
  }
  return NaN;
}

function csvToRanges(csv: string[], size: number): Ranges | Result {
  const ranges = new Ranges();
  let unsatisfiable = false;

  for (const item of csv) {
    const indexOf = item.indexOf("-");
    if (indexOf === -1) {
      continue;
    }

    const startStr = item.slice(0, indexOf).trim();
    const endStr = item.slice(indexOf + 1).trim();

    let start = parsePos(startStr);
    let end = parsePos(endStr);

    if (startStr.length === 0) {
      start = size - end;
      end = size - 1;
    } else if (endStr.length === 0) {
      end = size - 1;
    }

    if (end > size - 1) {
      end = size - 1;
    }

    if (Number.isNaN(start) || Number.isNaN(end)) {
      continue;
    }

    if (start > end || start < 0) {
      unsatisfiable = true;
      continue;
    }

    ranges.push({ end: end, start: start });
  }

  if (ranges.length < 1) {
    return unsatisfiable ? ERROR_UNSATISFIABLE_RESULT : ERROR_STRING_IS_NOT_HEADER;
  }

  return ranges;
}

/**
 * @description Parse "Range" header `text` relative to the given file `size`.
 * @param {number} size - Size
 * @param {string} header - Header string
 * @param {Options=} options - Options
 * @returns {Ranges|Result}
 * @throws {TypeError}
 */
export function parseRange(size: number, header: string, options?: Options): Ranges | Result {
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
  if (typeof header !== "string") {
    if (throwError) {
      throw new TypeError(`Argument 'header' must be a string.`);
    } else {
      return ERROR_INVALID_ARGUMENT;
    }
  }
  const indexOfEqualSign = header.indexOf("=");
  if (indexOfEqualSign === -1) {
    return ERROR_STRING_IS_NOT_HEADER;
  }
  const csv = header.slice(indexOfEqualSign + 1).split(",");
  const ranges = csvToRanges(csv, size);
  if (typeof ranges === "number") {
    return ranges;
  }
  ranges.type = header.slice(0, indexOfEqualSign);
  return options && options.combine ? combineRanges(ranges) : ranges;
}
