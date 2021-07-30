import { issuesToLineNumbers } from '../../lib/issue-to-line';
import { CloudConfigFileTypes } from '../../lib/types';

const dumyFileContent = 'dumy';
const dumyPath = ['dumy'];

describe('issuePathToLineNumber', () => {
  test('Unsupported type', () => {
    expect(() => {
      issuesToLineNumbers(
        dumyFileContent,
        CloudConfigFileTypes.JSON + 100,
        dumyPath,
      );
    }).toThrowError('Unknown format');
  });
});
