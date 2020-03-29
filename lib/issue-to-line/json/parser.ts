import {
  FileStructureTree,
  FileStructureNode,
  MapsDocIdToTree,
} from '../../types';
import JsonIterator from './iterator';

const COLON = ':';
const BRACKET_OPEN = '[';
const BRACKET_CLOSE = ']';
const CURLY_BRACKET_OPEN = '{';
const CURLY_BRACKET_CLOSE = '}';
const COMMA = ',';
const MINUS = '-';

const possibleValueTypes = ['String', 'Boolean', 'Null', 'Numeric'];

export function buildJsonTreeMap(jsonContent: string): MapsDocIdToTree {
  const iter = new JsonIterator(jsonContent);
  iter.next();
  iter.skipComments();
  const singleWalk = walk(iter);

  const tree: FileStructureTree = {
    nodes: singleWalk[0].values as FileStructureNode[],
  };

  // JSON are always single doc
  return {
    0: tree,
  };
}

function skipCommentsAndParseObjectOrArray(
  iter: JsonIterator,
  shouldParseObject: boolean,
): FileStructureNode[] {
  iter.pushLastProp();
  iter.skipComments();

  let nodes: FileStructureNode[] = [];
  if (shouldParseObject) {
    nodes = parseObject(iter);
  } else {
    nodes = parseArray(iter);
  }

  // bypass }
  iter.next();
  iter.restoreProp();

  return nodes;
}

function parseObject(iter: JsonIterator): FileStructureNode[] {
  const nodes: FileStructureNode[] = [];
  let firstLoop = true;
  let name: string;
  while (!iter.isCurrentValue(CURLY_BRACKET_CLOSE)) {
    if (!firstLoop) {
      // key-value pair delimiter
      iter.expectValue(COMMA);
      iter.next();
      iter.skipComments();

      // If there is a trailing comma, we might reach the end
      // ```
      // {
      //   "a": 1,
      // }
      // ```
      if (iter.isCurrentValue(CURLY_BRACKET_CLOSE)) {
        break;
      }
    }

    firstLoop = false;
    iter.expectType('String');
    name = JSON.parse(iter.current().value);

    iter.setLastProp(name);

    iter.next();

    iter.expectValue(COLON);

    iter.next();

    nodes.push(...walk(iter));
  }

  return nodes;
}

function parseArray(iter: JsonIterator): FileStructureNode[] {
  const nodes: FileStructureNode[] = [];
  let firstLoop = true;
  let i = 0;
  while (!iter.isCurrentValue(BRACKET_CLOSE)) {
    if (!firstLoop) {
      iter.expectValue(COMMA);
      iter.next();
      iter.skipComments();

      if (iter.isCurrentValue(BRACKET_CLOSE)) {
        break;
      }
    }

    firstLoop = false;

    iter.setLastProp(i);

    nodes.push(...walk(iter));
    iter.skipComments();

    i++;
  }

  return nodes;
}

function handleNativeCase(iter: JsonIterator): FileStructureNode[] {
  if (!possibleValueTypes.includes(iter.current().type)) {
    throw new Error('failed to find type ' + iter.current().type);
  }

  // turn "apiVersion" -> apiVersion
  // turn 'apiVersion' -> apiVersion
  let currentValue: string = iter.current().value;
  if (
    (currentValue.startsWith('"') && currentValue.endsWith('"')) ||
    (currentValue.startsWith("'") && currentValue.endsWith("'"))
  ) {
    currentValue = currentValue.substring(1, currentValue.length - 1);
  }

  const nativeNode: FileStructureNode = {
    key: iter.getLastProp(),
    lineLocation: iter.getCurrentLocation(),
    values: currentValue,
  };

  iter.next();
  return [nativeNode];
}

function walk(iter: JsonIterator): FileStructureNode[] {
  const currentNode: FileStructureNode = {
    key: iter.getLastProp(),
    lineLocation: iter.getCurrentLocation(),
    values: [],
  };

  switch (iter.current().value) {
    case CURLY_BRACKET_OPEN:
      iter.next();
      return [
        {
          ...currentNode,
          values: skipCommentsAndParseObjectOrArray(iter, true),
        },
      ];
    case BRACKET_OPEN:
      iter.next();
      return skipCommentsAndParseObjectOrArray(iter, false).map((value, i) => {
        return {
          key: `${iter.getLastProp()}[${i}]`,
          lineLocation: value.lineLocation,
          values: value.values,
        };
      });
    case MINUS:
      iter.next();
      break;
  }

  return handleNativeCase(iter);
}
