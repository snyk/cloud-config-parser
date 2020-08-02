import { TFLineState, TFLineTypes, MultiLinePhrase, Line } from './types';
import { FileStructureNode } from '../../types';

export const Charts = {
  space: ' ',
  equal: '=',
  commentHash: '#',
  commentDash: '//',
  multilineCommentStart: '/*',
  multilineCommentEnd: '*/',
  multilinePhrase: '<<',
  openBracketsObject: '{',
  closeBracketsObject: '}',
  openBracketsArray: '[',
  closeBracketsArray: ']',
};

export function getLineState(
  line: Line,
  isMultiLineComment: boolean,
  multiLinePhrase: MultiLinePhrase,
): TFLineState {
  let multiCommentLine = isMultiLineComment;
  let ignoredLine = false;

  if (line.content.startsWith(Charts.multilineCommentStart)) {
    ignoredLine = true;
    multiCommentLine = true;
  }

  if (line.content.includes(Charts.multilineCommentEnd)) {
    // Multiline comment ended - this is still a commented line
    ignoredLine = true;
    multiCommentLine = false;
  }

  if (
    line.content.startsWith(Charts.commentHash) ||
    line.content.startsWith(Charts.commentDash) ||
    line.content.length === 0 //Empty Line
  ) {
    ignoredLine = true;
  }

  // Inside a multiline comment
  if (isMultiLineComment && !ignoredLine) {
    ignoredLine = true;
  }

  // Inside a multiline phrase
  if (
    multiLinePhrase.phrase &&
    !line.content.includes(multiLinePhrase.phrase)
  ) {
    ignoredLine = true;
  }

  return {
    ignoredLine,
    multiCommentLine,
  };
}

export function getMultiLinePhrase(line: Line): MultiLinePhrase {
  const phrase = line.content
    .split(Charts.multilinePhrase)[1]
    .trim()
    .split(Charts.space)[0];
  return { phrase };
}

export function getLineType(
  line: Line,
  currentObjectType?: TFLineTypes,
): TFLineTypes {
  if (!currentObjectType) {
    if (line.content.includes(Charts.openBracketsObject)) {
      if (line.content.includes(Charts.closeBracketsObject)) {
        return TFLineTypes.TYPE_START_AND_END;
      }

      return TFLineTypes.TYPE_START;
    }
    throw new SyntaxError('Invalid TF input - TF Object without parent Type');
  }

  if (line.content.includes(Charts.openBracketsArray)) {
    if (line.content.includes(Charts.closeBracketsArray)) {
      return TFLineTypes.ARRAY_START_AND_END;
    }
    return TFLineTypes.ARRAY_START;
  }

  if (line.content.includes(Charts.closeBracketsArray)) {
    return TFLineTypes.ARRAY_END;
  }

  if (line.content.includes(Charts.multilinePhrase)) {
    return TFLineTypes.MULTILINE_STRING;
  }

  if (line.content.includes(Charts.openBracketsObject)) {
    if (line.content.includes(Charts.closeBracketsObject)) {
      if (line.content.includes(Charts.equal)) {
        return TFLineTypes.STRING;
      }

      return TFLineTypes.OBJECT_START_AND_END;
    }
    return TFLineTypes.OBJECT_START;
  }

  if (line.content.includes(Charts.equal)) {
    return TFLineTypes.STRING;
  }

  if (line.content.includes(Charts.closeBracketsObject)) {
    if (currentObjectType === TFLineTypes.SUB_TYPE) {
      return TFLineTypes.TYPE_END;
    }
    return TFLineTypes.OBJECT_END;
  }

  if (line.content.startsWith(Charts.multilinePhrase)) {
    return TFLineTypes.MULTILINE_STRING;
  }

  if (currentObjectType === TFLineTypes.ARRAY_START) {
    // Handling case of multi-line array object where the content is not yet finished.
    // Those lines will be skipped as part of
    // https://github.com/snyk/cloud-config-parser/blob/b5f5bdd8dd60cb3ad9c110bb6c640f08db0e108b/lib/issue-to-line/tf/parser.ts#L44
    return TFLineTypes.STRING;
  }

  throw new SyntaxError('Invalid TF input - Unknown line type');
}

export function getNode(
  key: string,
  line: Line,
  values?: FileStructureNode[] | string,
): FileStructureNode {
  const node: FileStructureNode = {
    key,
    lineLocation: {
      line: line.number + 1,
      columnStart: 0,
      columnEnd: line.content.length,
    },
    values: values ? values : [],
  };

  return node;
}
