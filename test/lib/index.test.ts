import { issuePathToLineNumber } from '../../lib/issue-to-line';
import { CloudConfigFileTypes } from '../../lib/types';

const dumyFileContent = 'dumy';
const dumyFileContentYaml = 'dumy: test';
const dumyPath = ['dumy'];

describe('issuePathToLineNumber', () => {
  test('YAML file', () => {
    expect(
      issuePathToLineNumber(
        dumyFileContentYaml,
        CloudConfigFileTypes.YAML,
        dumyPath,
      ),
    ).toEqual(1);
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
