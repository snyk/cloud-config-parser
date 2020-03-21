import * as types from '../types';
import { findLineNumberToPath } from './utils';

export function issuePathToLineNumber(
  fileContent: string,
  fileType: types.CloudConfigFileTypes,
  path: string[],
): number {
  switch (fileType) {
    case types.CloudConfigFileTypes.YAML: {
      const lineNumber = findLineNumberToPath(fileContent, fileType, path);
      return lineNumber;
    }
    case types.CloudConfigFileTypes.JSON:
      throw new Error('JSON format is not supported');
    default:
      throw new Error('Unknown format');
  }
}
