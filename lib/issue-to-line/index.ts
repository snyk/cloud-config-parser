import * as types from '../types';
import {
  buildTreeForTypeMap,
  getPathDetails,
  findLineNumberOfGivenPath,
} from './utils';

export function issuePathToLineNumber(
  fileContent: string,
  fileType: types.CloudConfigFileTypes,
  path: string[],
): number {
  if (!Object.values(types.CloudConfigFileTypes).includes(fileType)) {
    throw new Error('Unknown format');
  }

  const trees = buildTreeForTypeMap[fileType](fileContent);
  const pathDetails = getPathDetails(path, fileType);
  const treeNodes: types.FileStructureNode[] = trees[pathDetails.docId].nodes;
  return findLineNumberOfGivenPath(treeNodes, pathDetails);
}
