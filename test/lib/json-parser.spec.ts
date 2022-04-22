import { readFileSync } from 'fs';
import { issuesToLineNumbers } from '../../lib/issue-to-line/index';
import { CloudConfigFileTypes } from '../../lib/types';

describe('JSON Parser - working JSONS', () => {
  const simpleJson = 'test/fixtures/json/single.json';
  const simpleJsonContent = readFileSync(simpleJson).toString();

  test('Path without array - full path exists', () => {
    const path: string[] = ['spec', 'selector', 'app.kubernetes.io/name'];

    expect(
      issuesToLineNumbers(simpleJsonContent, CloudConfigFileTypes.JSON, path),
    ).toEqual(19);
  });

  test('Path without array - full path not exists', () => {
    const path: string[] = ['spec', 'selector', 'app.kubernetes.io/notExist'];

    expect(
      issuesToLineNumbers(simpleJsonContent, CloudConfigFileTypes.JSON, path),
    ).toEqual(-1);
  });

  test('Path with array - full path exists', () => {
    const path: string[] = [
      'spec',
      'template',
      'spec',
      'containers[snyky1]',
      'securityContext',
      'privileged',
    ];

    expect(
      issuesToLineNumbers(simpleJsonContent, CloudConfigFileTypes.JSON, path),
    ).toEqual(56);
  });

  test('Path with array - full path exists - container array with number', () => {
    const path: string[] = [
      'spec',
      'template',
      'spec',
      'containers[0]',
      'securityContext',
      'privileged',
    ];

    expect(
      issuesToLineNumbers(simpleJsonContent, CloudConfigFileTypes.JSON, path),
    ).toEqual(56);
  });

  test('Path with array - full path exists - array in the end (same line)', () => {
    const path: string[] = [
      'spec',
      'template',
      'spec',
      'containers[snyky1]',
      'securityContext',
      'capabilities',
      'drop[0]',
    ];

    expect(
      issuesToLineNumbers(simpleJsonContent, CloudConfigFileTypes.JSON, path),
    ).toEqual(58);
  });

  test('Path with array - full path exists - array in the end (not the same line)', () => {
    const path: string[] = [
      'spec',
      'template',
      'spec',
      'containers[snyky2]',
      'securityContext',
      'capabilities',
      'drop[0]',
    ];

    expect(
      issuesToLineNumbers(simpleJsonContent, CloudConfigFileTypes.JSON, path),
    ).toEqual(90);
  });

  test('Path with array - full path not exists', () => {
    const path: string[] = [
      'spec',
      'template',
      'spec',
      'containers[snyky1]',
      'securityContext',
      'NoExists',
    ];

    expect(
      issuesToLineNumbers(simpleJsonContent, CloudConfigFileTypes.JSON, path),
    ).toEqual(-1);
  });

  test('Path with array - full path not exists - stops at array', () => {
    const path: string[] = [
      'spec',
      'template',
      'spec',
      'containers[snyky1]',
      'nonExistingsecurityContext',
      'capabilities',
    ];

    expect(
      issuesToLineNumbers(simpleJsonContent, CloudConfigFileTypes.JSON, path),
    ).toEqual(-1);
  });
});

describe('JSON Parser - broken JSONS', () => {
  test('Broken JSON - cut in the middle of an object', () => {
    const path: string[] = ['specs'];

    const filePath = 'test/fixtures/json/broken-object.json';
    const fileContent = readFileSync(filePath).toString();
    expect(() => {
      issuesToLineNumbers(fileContent, CloudConfigFileTypes.JSON, path);
    }).toThrowError('unexpected end of JSON input');
  });

  test('Broken JSON - cut in the middle of an array', () => {
    const path: string[] = ['specs'];

    const filePath = 'test/fixtures/json/broken-array.json';
    const fileContent = readFileSync(filePath).toString();

    expect(() => {
      issuesToLineNumbers(fileContent, CloudConfigFileTypes.JSON, path);
    }).toThrowError('unexpected end of JSON input');
  });

  test('Broken JSON - cut in the middle of an array of array', () => {
    const path: string[] = ['specs'];

    const filePath = 'test/fixtures/json/broken-array-in-array.json';
    const fileContent = readFileSync(filePath).toString();

    expect(() => {
      issuesToLineNumbers(fileContent, CloudConfigFileTypes.JSON, path);
    }).toThrowError('unexpected end of JSON input');
  });

  test('Broken JSON - empty', () => {
    const path: string[] = ['specs'];

    expect(() => {
      issuesToLineNumbers('', CloudConfigFileTypes.JSON, path);
    }).toThrowError('unexpected end of JSON input');
  });

  test('Broken JSON - single chars', () => {
    const path: string[] = ['specs'];

    const InvalidChars = ['', ' ', '{', '['];
    for (const brokenJson of InvalidChars) {
      expect(() => {
        issuesToLineNumbers(brokenJson, CloudConfigFileTypes.JSON, path);
      }).toThrowError('unexpected end of JSON input');
    }
  });

  test('Broken JSON - tokenize errors', () => {
    const path: string[] = ['specs'];

    const InvalidChars = ["'", '"'];
    for (const brokenJson of InvalidChars) {
      expect(() => {
        issuesToLineNumbers(brokenJson, CloudConfigFileTypes.JSON, path);
      }).toThrowError('Line 1: Unexpected token ILLEGAL');
    }
  });

  test('Broken JSON - punctuator errors', () => {
    const path: string[] = ['specs'];

    const InvalidChars = ['}', ']'];
    for (const brokenJson of InvalidChars) {
      expect(() => {
        issuesToLineNumbers(brokenJson, CloudConfigFileTypes.JSON, path);
      }).toThrowError('failed to find type Punctuator');
    }
  });
});
