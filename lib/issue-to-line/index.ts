import * as types from '../types';

function getRandomLineNumber(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}

export function issuePathToLineNumber(
  fileContent: string,
  fileType: types.CloudConfigFileTypes,
  path: string[],
): number {
  console.log(path);
  switch (fileType) {
    case types.CloudConfigFileTypes.YAML: {
      const numberOfLines = fileContent.split('\n').length;
      return getRandomLineNumber(numberOfLines);
    }
    case types.CloudConfigFileTypes.JSON:
      throw new Error('JSON format is not supported');
    default:
      throw new Error('Unknown format');
  }
}
