import { readFileSync } from 'fs';
import { issuePathToLineNumber } from '../../lib/issue-to-line/index';
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
      issuePathToLineNumber(yamlContent, CloudConfigFileTypes.YAML, path),
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
      issuePathToLineNumber(yamlContent, CloudConfigFileTypes.YAML, path),
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
      issuePathToLineNumber(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(75);
  });

  test('Path with array - full path exists - container array with number', () => {
    const path: string[] = [
      '[DocId: 1]',
      'spec',
      'template',
      'spec',
      'containers[0]',
      'resources',
      'securityContext',
      'privileged',
    ];

    expect(
      issuePathToLineNumber(yamlContent, CloudConfigFileTypes.YAML, path),
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
      issuePathToLineNumber(yamlContent, CloudConfigFileTypes.YAML, path),
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
      issuePathToLineNumber(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(74);
  });

  test('Path with array - full path not exists - stops at array', () => {
    const path: string[] = [
      '[DocId: 1]',
      'spec',
      'template',
      'spec',
      'containers[snyky1]',
      'nonExistingResource',
      'securityContext',
      'capabilities',
    ];

    expect(
      issuePathToLineNumber(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(55);
  });

  test('Path without array - path not exists - 1 item', () => {
    const path: string[] = ['[DocId: 0]', 'specs'];

    expect(
      issuePathToLineNumber(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(2);
  });

  test('Path not exists - 1 item, on first document', () => {
    const path: string[] = ['[DocId: 0]', 'specs', 'selector'];

    expect(
      issuePathToLineNumber(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(2);
  });

  test('Path not exists - 1 item, on second document', () => {
    const path: string[] = ['[DocId: 1]', 'specs'];

    expect(
      issuePathToLineNumber(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(31);
  });

  test('No DocId - default DocId: 0', () => {
    const path: string[] = ['spec', 'selector', 'app.kubernetes.io/name'];

    expect(
      issuePathToLineNumber(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(27);
  });
});

describe('Yaml Parser - Single document', () => {
  const fileName = 'test/fixture/single.yaml';
  const yamlContent = readFileSync(fileName).toString();

  test('Path without array - full path exists', () => {
    const path: string[] = [
      '[DocId: 0]',
      'spec',
      'selector',
      'app.kubernetes.io/instance',
    ];

    expect(
      issuePathToLineNumber(yamlContent, CloudConfigFileTypes.YAML, path),
    ).toEqual(27);
  });
});
