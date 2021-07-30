import * as types from '../types';
import {
  buildTreeForTypeMap,
  getPathDetails,
  findLineNumberOfGivenPath,
} from './utils';
import { CloudConfigFileTypes, MapsDocIdToTree } from '../types';

export function issuesToLineNumbers(
  fileContent: string,
  fileType: types.CloudConfigFileTypes,
  path: string[],
): number {
  const trees = getTrees(fileType, fileContent);
  return getLineNumber(path, fileType, trees);
}

export function getTrees(fileType: CloudConfigFileTypes, fileContent: string) {
  assertFileType(fileType);
  const trees = buildTreeForTypeMap[fileType](fileContent);
  if (Object.keys(trees).length === 0) {
    throw new Error('failed to create trees');
  }
  return trees;
}

export function getLineNumber(
  path: string[],
  fileType: CloudConfigFileTypes,
  trees: MapsDocIdToTree,
) {
  assertFileType(fileType);
  const pathDetails = getPathDetails(path.slice(), fileType);
  const treeNodes: types.FileStructureNode[] = trees[pathDetails.docId].nodes;
  return findLineNumberOfGivenPath(treeNodes, pathDetails);
}

function assertFileType(fileType: CloudConfigFileTypes) {
  if (!Object.values(types.CloudConfigFileTypes).includes(fileType)) {
    throw new Error('Unknown format');
  }
}
