import getIndent from './getIndent';
import isMultiline from './isMultiline';
import trimmedNodeRange from './trimmedNodeRange';
import type MagicString from 'magic-string';
import type { Node } from '../types';

const NEWLINE = '\n';
const SPACE = ' ';
const TAB = '\t';
const HASH = '#';

/**
 * Adds a closing curly brace on a new line after a node with the proper indent.
 */
export default function appendClosingBrace(node: Node, patcher: MagicString): number {
  const source = patcher.original;
  const originalInsertionPoint = trimmedNodeRange(node, source)[1];

  if (!isMultiline(source, node)) {
    patcher.insert(originalInsertionPoint, '}');
    return originalInsertionPoint;
  }

  let insertionPoint = seekToEndOfStatementOrLine(source, originalInsertionPoint);

  patcher.insert(
    insertionPoint,
    `\n${getIndent(source, node.range[0])}}`
  );

  return insertionPoint;
}

/**
 * Finds the last character of a statement or, if there is a comment or
 * whitespace following it on the same line, finds the end of the line.
 */
function seekToEndOfStatementOrLine(source: string, index: number): number {
  let insideComment = false;

  while (index < source.length) {
    let char = source[index];

    if (char === NEWLINE) {
      break;
    } else if (char === HASH) {
      insideComment = true;
    } else if (!insideComment && char !== SPACE && char !== TAB) {
      break;
    }

    index++;
  }

  return index;
}
