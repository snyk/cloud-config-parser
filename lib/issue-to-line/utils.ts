import { CloudConfigFileTypes, TreesMap, PathDetails, Node } from '../types';
import { buildYamlTree } from './yaml-parser';

const buildTreeForType = {
  [CloudConfigFileTypes.YAML]: buildYamlTree,
  [CloudConfigFileTypes.JSON]: buildJsonTree,
};

function buildJsonTree(): TreesMap {
  //TODO: Placeholder for adding JSON Implementation
  return [];
}

export function findLineNumberToPath(
  fileContent: string,
  fileType: CloudConfigFileTypes,
  path: string[],
): number {
  const trees = buildTreeForType[fileType](fileContent);
  const pathDetails = getPathDetails(path, fileType);
  const treeNodes: Node[] = trees[pathDetails.DocId].node;
  return findLinePerPath(treeNodes, pathDetails);
}

function getPathDetails(
  path: string[],
  fileType: CloudConfigFileTypes,
): PathDetails {
  if (fileType === CloudConfigFileTypes.YAML) {
    const firstPath = path[0];
    if (firstPath.includes('[DocId:')) {
      const docId = firstPath.replace('[DocId: ', '').replace(']', '');
      const pathWithoutDocId = path.splice(1);
      return {
        DocId: parseInt(docId),
        Path: removeInputPathPrefix(pathWithoutDocId),
      };
    }
  }
  return {
    DocId: 0,
    Path: removeInputPathPrefix(path),
  };
}

function removeInputPathPrefix(path: string[]): string[] {
  if (path[0] === 'input') {
    return path.splice(1);
  }
  return path;
}

function findLinePerPath(nodes: Node[], pathDetails: PathDetails): number {
  const filteredNodes = nodes.filter(
    (node) => node.key === pathDetails.Path[0],
  );
  if (filteredNodes.length === 0) {
    //Not exists
    return nodes[0].lineLocation.line;
  }

  if (pathDetails.Path.length === 1) {
    return filteredNodes[0].lineLocation.line;
  } else {
    return getLineNumber(filteredNodes[0], pathDetails.Path, 1);
  }
}

function getLineNumber(node: Node, path: string[], index: number): number {
  if (typeof node.values === 'string' || index === path.length) {
    return node.lineLocation.line;
  } else {
    const nodes = node.values.filter((node) => node.key === path[index]);
    if (nodes.length === 0) {
      //Not exists
      return node.lineLocation.line;
    } else {
      return getLineNumber(nodes[0], path, index + 1);
    }
  }
}
