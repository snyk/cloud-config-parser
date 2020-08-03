import { MapsDocIdToTree, FileStructureNode } from '../../types';
import { TFLineTypes, TFState, MultiLinePhrase, Line } from './types';
import {
  Charts,
  getLineState,
  getLineType,
  getNode,
  getMultiLinePhrase,
} from './utils';

export function buildTfTreeMap(tfContent: string): MapsDocIdToTree {
  let multiLineComment = false;
  let multiLinePhrase: MultiLinePhrase = { phrase: null };
  const nodes: FileStructureNode[] = [];
  let currNode: FileStructureNode | null = null;

  let stateQueue: TFState[] = [];
  let duringTypeParsing = false;

  const tfFileLines = tfContent.split('\n');
  for (let i = 0; i < tfFileLines.length; i++) {
    const line: Line = { content: tfFileLines[i].trim(), number: i };

    const lineState = getLineState(line, multiLineComment, multiLinePhrase);
    multiLineComment = lineState.multiCommentLine;

    if (lineState.ignoredLine) {
      continue;
    }

    if (multiLinePhrase.phrase) {
      //Multi-line phrase ended - line is not ignored any more
      multiLinePhrase.phrase = null;
      continue;
    }

    let topType;
    if (stateQueue.length > 0) {
      topType = stateQueue[stateQueue.length - 1].type;
    }
    const lineType = getLineType(line, topType);

    //In case of array value where is multiline and not completed yet - can skip this line
    if (
      topType === TFLineTypes.ARRAY_START &&
      lineType !== TFLineTypes.ARRAY_END
    ) {
      continue;
    }

    switch (lineType) {
      case TFLineTypes.TYPE_START:
        currNode = getTypeDetailsFromLine(line, nodes, stateQueue);
        duringTypeParsing = true;
        continue;

      case TFLineTypes.TYPE_START_AND_END:
        currNode = getTypeDetailsFromLine(line, nodes, stateQueue);
        stateQueue = [];
        duringTypeParsing = false;
        continue;

      case TFLineTypes.TYPE_END:
        if (topType !== TFLineTypes.SUB_TYPE) {
          throw new SyntaxError(
            'Invalid TF Input - End of type object without sub type',
          );
        }
        stateQueue = [];
        duringTypeParsing = false;
        continue;

      case TFLineTypes.OBJECT_START:
        currNode = getObjectNode(line, stateQueue);
        continue;

      case TFLineTypes.OBJECT_START_AND_END:
        getObjectNode(line, stateQueue);
        stateQueue.pop();
        continue;

      case TFLineTypes.OBJECT_END: {
        currNode = handleObjectEnd(currNode, stateQueue);
        continue;
      }

      case TFLineTypes.STRING:
      case TFLineTypes.MULTILINE_STRING:
      case TFLineTypes.ARRAY_START_AND_END:
      case TFLineTypes.ARRAY_START: {
        if (!currNode) {
          throw new SyntaxError(
            'Unexpected TF input - Simple object without parent node',
          );
        }
        const simpleNode = getSimpleNode(line);
        (currNode.values as FileStructureNode[]).push(simpleNode);

        if (lineType === TFLineTypes.ARRAY_START) {
          stateQueue.push({
            structure: simpleNode,
            type: lineType,
          });
        }

        if (lineType === TFLineTypes.MULTILINE_STRING) {
          multiLinePhrase = getMultiLinePhrase(line);
        }

        continue;
      }
      case TFLineTypes.ARRAY_END: {
        stateQueue.pop();
        continue;
      }
      default:
        throw new SyntaxError(
          `Invalid TF input - Unhandled line type ${TFLineTypes[lineType]}`,
        );
    }
  }

  if (duringTypeParsing || stateQueue.length !== 0) {
    throw new SyntaxError('Invalid TF input - Broken file');
  }

  if (nodes.length === 0) {
    throw new SyntaxError('Invalid TF input - No nodes were parsed');
  }

  // TF are always single doc
  return {
    0: { nodes },
  };
}

function getTypeDetailsFromLine(
  currentLine: Line,
  nodes: FileStructureNode[],
  stateQueue: TFState[],
): FileStructureNode {
  const lineContent = currentLine.content.split(Charts.space);
  let resourceType = lineContent[1].replace(/"/g, '');
  const objectType = lineContent[0];

  if (resourceType === Charts.openBracketsObject) {
    if (objectType === 'terraform') {
      //Support Terraform settings object
      resourceType = '';
    } else {
      throw new SyntaxError('Invalid TF input - Type object without sub type');
    }
  }

  const headNode: FileStructureNode = getTypeNode(
    objectType,
    currentLine,
    nodes,
  );

  if (
    lineContent[2] &&
    lineContent[2] !== null &&
    lineContent[2] !== Charts.openBracketsObject
  ) {
    const resourceName = lineContent[2].replace(/"/g, '');
    resourceType = `${resourceType}[${resourceName}]`;
  }

  const subHeadNode: FileStructureNode = getSubTypeNode(
    headNode,
    resourceType,
    currentLine,
  );

  stateQueue.push({ structure: headNode, type: TFLineTypes.TYPE_START });
  stateQueue.push({ structure: subHeadNode, type: TFLineTypes.SUB_TYPE });

  return subHeadNode;
}

function getTypeNode(
  objectType: string,
  line: Line,
  nodes: FileStructureNode[],
): FileStructureNode {
  let headNode = nodes.find((node) => node.key === objectType);

  if (!headNode) {
    headNode = getNode(objectType, line, []);
    nodes.push(headNode);
  }

  return headNode;
}

function getSubTypeNode(
  headNode: FileStructureNode,
  resourceType: string,
  line: Line,
): FileStructureNode {
  const headerSubTypes = headNode.values as FileStructureNode[];

  let subHeadNode = headerSubTypes.find((node) => node.key === resourceType);

  if (!subHeadNode) {
    subHeadNode = getNode(resourceType, line);
    (headNode.values as FileStructureNode[]).push(subHeadNode);
  }
  return subHeadNode;
}

function getObjectNode(line: Line, stateQueue: TFState[]): FileStructureNode {
  const key = line.content
    .split(Charts.openBracketsObject)[0]
    .split(Charts.equal)[0]
    .trim();
  const objectNode: FileStructureNode = getNode(key, line);

  stateQueue.push({ structure: objectNode, type: TFLineTypes.OBJECT_START });

  return objectNode;
}

function getSimpleNode(line: Line): FileStructureNode {
  const [key, value] = line.content.split(Charts.equal);
  return getNode(key.trim(), line, value.trim().replace(/"/g, ''));
}

function handleObjectEnd(
  currNode: FileStructureNode | null,
  stateQueue: TFState[],
): FileStructureNode {
  let topState = stateQueue[stateQueue.length - 1];
  if (topState.type !== TFLineTypes.OBJECT_START || stateQueue.length === 0) {
    throw new SyntaxError('Invalid TF Input - Object end without start');
  }

  if (!currNode) {
    throw new SyntaxError('Invalid TF input - Object without parent');
  }

  stateQueue.pop();
  topState = stateQueue[stateQueue.length - 1];
  const topNode = topState.structure as FileStructureNode;
  (topNode.values as FileStructureNode[]).push(currNode);
  return topNode;
}
