import { issuePathToLineNumber } from '../../lib/issue-to-line';
import { CloudConfigFileTypes } from '../../lib/types';

const dumyFileContent = 'dumy';
const dumyPath = ['dumy'];

describe('issuePathToLineNumber', () => {
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
