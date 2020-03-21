import { readFileSync } from 'fs';
import { findLineNumberToPath } from '../../lib/issue-to-line/utils';
import { CloudConfigFileTypes } from '../../lib/types';

describe('Yaml Parser', () => {
  const fileName = 'test/fixture/multi.yaml';
  const yamlContent = readFileSync(fileName).toString();

  test('Path without array - full path exists', () => {
    const path: string[] = [
      '[DocId: 0]',
      'spec',
      'selector',
      'app.kubernetes.io/name',
    ];

    expect(
      findLineNumberToPath(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(27);
  });

  test('Path without array - full path not exists', () => {
    const path: string[] = [
      '[DocId: 0]',
      'spec',
      'selector',
      'app.kubernetes.io/notExist',
    ];

    expect(
      findLineNumberToPath(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(26);
  });

  test('Path with array - full path exists', () => {
    const path: string[] = [
      '[DocId: 1]',
      'spec',
      'template',
      'spec',
      'containers[snyky1]',
      'resources',
      'securityContext',
      'privileged',
    ];

    expect(
      findLineNumberToPath(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(75);
  });

  test('Path with array - full path exists - array in the end', () => {
    const path: string[] = [
      '[DocId: 1]',
      'spec',
      'template',
      'spec',
      'containers[snyky1]',
      'resources',
      'securityContext',
      'capabilities',
      'drop[0]',
    ];

    expect(
      findLineNumberToPath(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(78);
  });

  test('Path with array - full path not exists', () => {
    const path: string[] = [
      '[DocId: 1]',
      'spec',
      'template',
      'spec',
      'containers[snyky1]',
      'resources',
      'securityContext',
      'NoExists',
    ];

    expect(
      findLineNumberToPath(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(74);
  });

  test('Path with array - full path not exists - stops at array', () => {
    const path: string[] = [
      '[DocId: 1]',
      'spec',
      'template',
      'spec',
      'containers[snyky1]',
      'resource',
      'securityContext',
      'capabilities',
    ];

    expect(
      findLineNumberToPath(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(55);
  });

  test('Path without array - path not exists - 1 item', () => {
    const path: string[] = ['[DocId: 0]', 'specs'];

    expect(
      findLineNumberToPath(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(2);
  });

  test('Path not exists - 1 item, on first document', () => {
    const path: string[] = ['[DocId: 0]', 'specs', 'selector'];

    expect(
      findLineNumberToPath(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(2);
  });

  test('Path not exists - 1 item, on second document', () => {
    const path: string[] = ['[DocId: 1]', 'specs'];

    expect(
      findLineNumberToPath(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(31);
  });

  test('No DocId - default DocId: 0', () => {
    const path: string[] = ['spec', 'selector', 'app.kubernetes.io/name'];

    expect(
      findLineNumberToPath(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(27);
  });
});
