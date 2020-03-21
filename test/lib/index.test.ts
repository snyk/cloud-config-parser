import { issuePathToLineNumber } from '../../lib/issue-to-line';
import { CloudConfigFileTypes } from '../../lib/types';

const dumyFileContent = 'dumy';
const dumyPath = ['dumy'];

describe('issuePathToLineNumber', () => {
  test('YAML file', () => {
    expect(
      issuePathToLineNumber(
        dumyFileContent,
        CloudConfigFileTypes.YAML,
        dumyPath,
      ),
    ).toEqual(0);
  });

  test('JSON - not supported', () => {
    expect(() => {
      issuePathToLineNumber(
        dumyFileContent,
        CloudConfigFileTypes.JSON,
        dumyPath,
      );
    }).toThrowError('JSON format is not supported');
  });

  test('Unsupported type', () => {
    expect(() => {
      issuePathToLineNumber(
        dumyFileContent,
        CloudConfigFileTypes.JSON + 100,
        dumyPath,
      );
    }).toThrowError('Unknown format');
  });
});
