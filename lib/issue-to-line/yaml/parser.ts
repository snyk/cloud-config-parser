const yamlJs = require('yaml-js');
import {
  FileStructureTree,
  FileStructureNode,
  MapsDocIdToTree,
  PathDetails,
} from '../../types';
import { getLineLocationForYamlElement, removeInputPathPrefix } from '../utils';
import { CommentObject, YamlNodeElement } from './types';

const NULL_TAG = 'tag:yaml.org,2002:null';
const STR_TAG = 'tag:yaml.org,2002:str';
const INT_TAG = 'tag:yaml.org,2002:int';
const FLOAT_TAG = 'tag:yaml.org,2002:float';
const BOOL_TAG = 'tag:yaml.org,2002:bool';
const MAP_TAG = 'tag:yaml.org,2002:map';
const SEQ_TAG = 'tag:yaml.org,2002:seq';
const TIMESTAMP_TAG = 'tag:yaml.org,2002:timestamp';

const KEY_NODE_INDEX = 0;
const VAL_NODE_INDEX = 1;

const COMMENT_CHAR = '#';
const MULTI_DOC_SEPARATOR = '---';

export function buildYamlTreeMap(yamlContent: string): MapsDocIdToTree {
  const yamlTrees: MapsDocIdToTree = {};
  let docsArray: CommentObject[] = [];
  try {
    docsArray = yamlJs.compose_all(yamlContent);
  } catch (error) {
    throw new Error('failed to compose_all for given yaml');
  }

  // Edge case that yamlJs does not handle -
  // The first lines, before the first doc separator (---) are comments
  // The yamlJs will ignore this lines and will have 1 less document than expected.
  // This will only happen for the first document which document object will not be added for
  if (
    yamlContent.startsWith(COMMENT_CHAR) &&
    yamlContent.split(MULTI_DOC_SEPARATOR).length === docsArray.length + 1
  ) {
    /* eslint-disable @typescript-eslint/camelcase */
    // Disable camelcase  - object structure from yamlJs
    const commentObject: CommentObject = {
      start_mark: { line: 0, column: 0, pointer: 0, buffer: yamlContent },
      end_mark: { line: 0, column: 0, pointer: 0, buffer: yamlContent },
      style: undefined,
      tag: NULL_TAG,
      unique_id: 'node_0',
      value: '',
    };
    /* eslint-enable @typescript-eslint/camelcase */
    docsArray.unshift(commentObject);
  }

  for (let i = 0; i < docsArray.length; i++) {
    const yamlDoc: YamlNodeElement = convertComposeElementToType(docsArray[i]);
    // Handle case of empty document - the tag will be null
    // No need to build tree for this document
    if (yamlDoc.tag !== NULL_TAG) {
      yamlTrees[i] = buildTree(yamlDoc);
    }
  }

  return yamlTrees;
}

function buildTree(yamlDoc: YamlNodeElement): FileStructureTree {
  const tree: FileStructureTree = { nodes: [] };

  if (yamlDoc.tag !== MAP_TAG) {
    throw new Error('Invalid tree - cannot build from map');
  }

  for (const yamlElementValues of yamlDoc.value) {
    const values: YamlNodeElement[] = [
      convertComposeElementToType(yamlElementValues[KEY_NODE_INDEX]),
      convertComposeElementToType(yamlElementValues[VAL_NODE_INDEX]),
    ];
    tree.nodes.push(...buildTreeBranch(values, []));
  }

  return tree;
}

function buildTreeBranch(
  yamlElements: YamlNodeElement[],
  path: string[],
): FileStructureNode[] {
  //We are checking on the valNode - which is the second element in the yamlElements array ([1])
  switch (yamlElements[VAL_NODE_INDEX].tag) {
    case NULL_TAG:
    case STR_TAG:
    case INT_TAG:
    case FLOAT_TAG:
    case BOOL_TAG:
    case TIMESTAMP_TAG:
      return buildPrimitiveLeaf(yamlElements);
    case MAP_TAG:
      return buildMapBranch(yamlElements, path);
    case SEQ_TAG:
      return buildSeqBranch(yamlElements, path);

    default:
      return [];
  }
}

function buildPrimitiveLeaf(
  yamlElements: YamlNodeElement[],
): FileStructureNode[] {
  const [keyNode, valNode] = yamlElements;
  const key: string = keyNode.value as string;
  const values: string = valNode.value as string;
  const lineLocation = getLineLocationForYamlElement(keyNode);
  return [
    {
      key,
      lineLocation,
      values,
    },
  ];
}

function buildMapBranch(
  yamlElements: YamlNodeElement[],
  path: string[],
): FileStructureNode[] {
  const keyNode = yamlElements[KEY_NODE_INDEX];

  const fullPath = path.concat([keyNode.value as string]);

  return [
    getFileStructureNodesForYamlElement(
      yamlElements,
      keyNode.value as string,
      fullPath,
    ),
  ];
}

function buildSeqBranch(
  yamlElements: YamlNodeElement[],
  path: string[],
): FileStructureNode[] {
  const [keyNode, valNode] = yamlElements;
  const seqNodes: FileStructureNode[] = [];
  for (let i = 0; i < valNode.value.length; i++) {
    const nodeElement: YamlNodeElement = convertComposeElementToType(
      valNode.value[i],
    );
    const key = `${keyNode.value}[${i}]`;
    const fullPath = path.concat(key);

    if (typeof nodeElement.value === 'string') {
      const lineLocation = getLineLocationForYamlElement(nodeElement);
      const node: FileStructureNode = {
        key,
        lineLocation,
        values: nodeElement.value,
      };
      seqNodes.push(node);
    } else {
      seqNodes.push(
        getFileStructureNodesForYamlElement(
          [nodeElement, nodeElement],
          key,
          fullPath,
        ),
      );
    }
  }
  return seqNodes;
}

function convertComposeElementToType(yamlElement: any): YamlNodeElement {
  return {
    id: yamlElement.id,
    tag: yamlElement.tag,
    startMark: {
      line: yamlElement.start_mark.line,
      column: yamlElement.start_mark.column,
      Buffer: yamlElement.start_mark.buffer,
      pointer: yamlElement.start_mark.pointer,
    },
    endMark: {
      line: yamlElement.end_mark.line,
      column: yamlElement.end_mark.column,
      Buffer: yamlElement.end_mark.buffer,
      pointer: yamlElement.end_mark.pointer,
    },
    value: yamlElement.value,
  };
}

function getFileStructureNodesForYamlElement(
  yamlElements: YamlNodeElement[],
  key: string,
  fullPath: string[],
): FileStructureNode {
  const [keyNode, valNode] = yamlElements;
  const nodes: FileStructureNode[] = [];
  const lineLocation = getLineLocationForYamlElement(keyNode);

  for (const yamlElementValues of valNode.value) {
    const values: YamlNodeElement[] = [
      convertComposeElementToType(yamlElementValues[KEY_NODE_INDEX]),
      convertComposeElementToType(yamlElementValues[VAL_NODE_INDEX]),
    ];
    nodes.push(...buildTreeBranch(values, fullPath));
  }

  return {
    key,
    lineLocation,
    values: nodes,
  };
}

export function getPathDetailsForYamlFile(path: string[]): PathDetails {
  const firstPath = path[0];
  if (firstPath.includes('[DocId:')) {
    const docId = firstPath.replace('[DocId: ', '').replace(']', '');
    const pathWithoutDocId = path.splice(1);
    return {
      docId: parseInt(docId),
      path: removeInputPathPrefix(pathWithoutDocId),
    };
  }

  return {
    docId: 0,
    path: removeInputPathPrefix(path),
  };
}
