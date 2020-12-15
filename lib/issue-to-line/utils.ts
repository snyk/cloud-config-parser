import {
  CloudConfigFileTypes,
  FileStructureNode,
  LineLocation,
  PathDetails,
} from '../types';
import { buildYamlTreeMap, getPathDetailsForYamlFile } from './yaml/parser';
import { buildJsonTreeMap } from './json/parser';
import { buildTfTreeMap } from './tf/parser';

export const buildTreeForTypeMap = {
  [CloudConfigFileTypes.YAML]: buildYamlTreeMap,
  [CloudConfigFileTypes.JSON]: buildJsonTreeMap,
  [CloudConfigFileTypes.TF]: buildTfTreeMap,
};

export function getPathDetails(
  path: string[],
  fileType: CloudConfigFileTypes,
): PathDetails {
  if (fileType === CloudConfigFileTypes.YAML) {
    return getPathDetailsForYamlFile(path);
  }
  return {
    docId: 0,
    path: removeInputPathPrefix(path),
  };
}

export function removeInputPathPrefix(path: string[]): string[] {
  if (path[0] === 'input') {
    return path.splice(1);
  }
  return path;
}

export function findLineNumberOfGivenPath(
  nodes: FileStructureNode[],
  pathDetails: PathDetails,
): number {
  const filteredNodes = nodes.filter(
    (node) => node.key === pathDetails.path[0],
  );
  if (filteredNodes.length === 0) {
    //Not exists
    return nodes[0].lineLocation.line;
  }

  if (pathDetails.path.length === 1) {
    return filteredNodes[0].lineLocation.line;
  }

  return getLineNumberForSingleNode(
    filteredNodes[0],
    pathDetails.path.splice(1),
  );
}

function getLineNumberForSingleNode(
  baseNode: FileStructureNode,
  remainingPath: string[],
): number {
  let node: FileStructureNode = baseNode;
  while (remainingPath.length) {
    if (typeof node.values === 'string') {
      return node.lineLocation.line;
    }

    const nodeForPath = getNodeForPath(node.values, remainingPath[0]);
    if (!nodeForPath) {
      //Not exists
      return node.lineLocation.line;
    }

    node = nodeForPath;
    remainingPath = remainingPath.splice(1);
  }

  return node.lineLocation.line;
}

function getNodeForPath(
  nodeValues: FileStructureNode[],
  path: string,
): FileStructureNode | undefined {
  if (!path.includes('[')) {
    return nodeValues.find(
      (currNode) =>
        currNode.key.startsWith(`${path}[`) || currNode.key === path,
    );
  }

  const [nodeName, subNodeName] = path.replace(']', '').split('[');
  const subNodeId: number = parseInt(subNodeName);
  if (!isNaN(subNodeId) && Number.isInteger(subNodeId)) {
    return nodeValues.find((currNode) => currNode.key === path);
  }

  return nodeValues.find((currNode) => {
    const values = currNode.values;

    if (typeof values !== 'string') {
      return (
        currNode.key === path ||
        (currNode.key.startsWith(nodeName) &&
          values.filter((value) => {
            return value.key === 'name' && value.values === subNodeName;
          }).length > 0)
      );
    }
    return false;
  });
}

export function getLineLocationForYamlElement(
  nodeElement: YamlNodeElement,
): LineLocation {
  return {
    line: nodeElement.startMark.line + 1,
    columnStart: nodeElement.startMark.pointer,
    columnEnd: nodeElement.endMark.pointer,
  };
}
