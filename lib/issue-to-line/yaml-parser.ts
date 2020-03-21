const yamlJs = require('yaml-js');
import * as _ from 'lodash';
import { Tree, Node, TreesMap } from '../types';

const NULL_TAG = 'tag:yaml.org,2002:null';
const STR_TAG = 'tag:yaml.org,2002:str';
const INT_TAG = 'tag:yaml.org,2002:int';
const FLOAT_TAG = 'tag:yaml.org,2002:float';
const BOOL_TAG = 'tag:yaml.org,2002:bool';
const MAP_TAG = 'tag:yaml.org,2002:map';
const SEQ_TAG = 'tag:yaml.org,2002:seq';

function isPrimitive(tag: string): boolean {
  return _.includes([NULL_TAG, STR_TAG, INT_TAG, FLOAT_TAG, BOOL_TAG], tag);
}

export function buildYamlTree(yamlContent: string): TreesMap {
  const yamlTrees: TreesMap = {};
  const ast = yamlJs.compose_all(yamlContent);
  for (let index = 0; index < ast.length; index++) {
    const composeComponent = ast[index];
    const tree = buildTree(composeComponent);
    yamlTrees[index] = tree;
  }
  return yamlTrees;
}

function buildTree(map: any): Tree {
  const tree: Tree = { node: [] };

  if (map.tag == MAP_TAG) {
    for (const pair of map.value) {
      tree.node.push(...buildTreeBranch(pair, []));
    }
  } else {
    throw new Error('Invalid tree - cannot build from map');
  }

  return tree;
}

function buildTreeBranch(map: any, path: string[]): Node[] {
  let keyNode;
  let valNode;

  if (map.hasOwnProperty('tag')) {
    keyNode = {
      value: _(path[0])
        .split('.')
        .last(),
      /* eslint-disable @typescript-eslint/camelcase */
      start_mark: map.start_mark,
    };
    valNode = map;
  } else {
    [keyNode, valNode] = map;
  }

  if (isPrimitive(valNode.tag)) {
    return buildPrimitiveLeaf(map);
  } else if (valNode.tag === MAP_TAG) {
    return buildMapBranch(map, path);
  } else if (valNode.tag === SEQ_TAG) {
    return buildSeqBranch(keyNode, valNode, path);
  }
  return [];
}

function buildPrimitiveLeaf(map: any): Node[] {
  const [keyNode, valNode] = map;
  return [
    {
      key: keyNode.value,
      lineLocation: {
        line: keyNode.start_mark.line + 1,
        columnStart: keyNode.start_mark.pointer,
        columnEnd: keyNode.end_mark.pointer,
      },
      values: valNode.value,
    },
  ];
}

function buildMapBranch(map: any, path: string[]): Node[] {
  const [keyNode, valNode] = map;
  const nodes: Node[] = [];
  const fullPath = path.concat([keyNode.value]);

  for (const pair of valNode.value) {
    nodes.push(...buildTreeBranch(pair, fullPath));
  }
  return [
    {
      key: keyNode.value,
      lineLocation: {
        line: keyNode.start_mark.line + 1,
        columnStart: keyNode.start_mark.pointer,
        columnEnd: keyNode.end_mark.pointer,
      },
      values: nodes,
    },
  ];
}

function buildSeqBranch(keyNode: any, valNode: any, path: string[]): Node[] {
  const seqNodes: Node[] = [];
  for (let index = 0; index < valNode.value.length; index++) {
    const nodeData = valNode.value[index];
    const nameObj = _.filter(
      nodeData.value,
      (valueObj) => valueObj[0].value === 'name',
    );
    let nameValue = index;
    if (nameObj.length) {
      nameValue = nameObj[0][1].value;
    }
    const key = `${keyNode.value}[${nameValue}]`;
    const fullPath = path.concat(key);

    if (typeof nodeData.value === 'string') {
      const node: Node = {
        key,
        lineLocation: {
          line: nodeData.start_mark.line + 1,
          columnStart: nodeData.start_mark.pointer,
          columnEnd: nodeData.end_mark.pointer,
        },
        values: nodeData.value,
      };
      seqNodes.push(node);
    } else {
      const nodes: Node[] = [];
      for (const pair of nodeData.value) {
        nodes.push(...buildTreeBranch(pair, fullPath));
      }

      const node: Node = {
        key,
        lineLocation: {
          line: nodeData.start_mark.line + 1,
          columnStart: nodeData.start_mark.pointer,
          columnEnd: nodeData.end_mark.pointer,
        },
        values: nodes,
      };
      seqNodes.push(node);
    }
  }
  return seqNodes;
}
