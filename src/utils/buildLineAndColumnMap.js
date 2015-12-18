const CR = 10; // \r
const LF = 13; // \n

/**
 * Maps between line/column pairs and offsets for the given source.
 */
class LineAndColumnMap {
  constructor(source: string) {
    const offsets = [0];

    var line = 0;
    var cursor = 0;

    while (cursor < source.length) {
      switch (source.charCodeAt(cursor)) {
        case CR:
          line++;
          cursor++;
          if (source.charCodeAt(cursor + 1) === LF) {
            cursor++;
          }
          offsets[line] = cursor;
          break;

        case LF:
          line++;
          cursor++;
          offsets[line] = cursor;
          break;

        default:
          cursor++;
          break;
      }
    }

    offsets[line + 1] = cursor;
    this.offsets = offsets;
  }

  /**
   * Gets the absolute character offset for the position at line & column.
   */
  getOffset(line: number, column: number): ?number {
    if (line + 1 >= this.offsets.length) {
      // Line out of bounds.
      return null;
    }

    const thisLineOffset = this.offsets[line];
    const nextLineOffset = this.offsets[line + 1];

    if (nextLineOffset - thisLineOffset < column) {
      // Column out of bounds.
      return null;
    }

    return thisLineOffset + column;
  }

  /**
   * Gets the line & column pair for an absolute character offset.
   */
  getLocation(offset: number): ?Array<number> {
    if (offset < 0 || this.offsets[this.offsets.length - 1] < offset) {
      // Offset out of bounds.
      return null;
    }

    // We start at offsets.length - 2 because the last entry is used to capture
    // the length of the last line, so there will always be N + 1 entries in
    // offsets for a string with N lines.
    for (let i = this.offsets.length - 2; i >= 0; i--) {
      if (offset >= this.offsets[i]) {
        return [i, offset - this.offsets[i]];
      }
    }
  }
}

/**
 * Builds a mapper between line/column pairs and offsets for the given source.
 */
export default function buildLineAndColumnMap(source: string): LineAndColumnMap {
  return new LineAndColumnMap(source);
}
