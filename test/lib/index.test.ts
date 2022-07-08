import {
  CloudConfigFileTypes,
  issuesToLineNumbers,
  parseFileContent,
} from '../../lib';
import * as fs from 'fs';
import * as path from 'path';

const dumyFileContent = 'dumy';
const dumyPath = ['dumy'];

describe('issuePathToLineNumber', () => {
  it('Throws an error for unsupported type', () => {
    expect(() => {
      issuesToLineNumbers(
        dumyFileContent,
        CloudConfigFileTypes.JSON + 100,
        dumyPath,
      );
    }).toThrowError('Unknown format');
  });

  it('returns first node if it can not match the path ', () => {
    const cloudformationContent = fs
      .readFileSync(
        path.resolve(__dirname, './issue-to-line/fixtures/cfn-example.yaml'),
      )
      .toString();
    expect(
      issuesToLineNumbers(cloudformationContent, CloudConfigFileTypes.YAML, [
        'path',
      ]),
    ).toEqual(-1);
  });
});

describe('parseFileContent', () => {
  it('Succeeds if YAML and it contains \\/', () => {
    /* eslint-disable no-useless-escape */
    expect(
      parseFileContent(`{
"foo": "\\/"
}`),
    ).toEqual([
      {
        foo: '/', // "\\/" is the equivalent of '/'
      },
    ]);
  });

  it('Throws an error if keys are not simple strings', () => {
    expect(() => {
      parseFileContent(`---
{ foo: "bar"}: bar`);
    }).toThrowError(
      'Keys with collection values will be stringified as YAML due to JS Object restrictions. Use mapAsMap: true to avoid this.',
    );
  });

  it('Succeeds even if there is insufficient indentation', () => {
    expect(
      parseFileContent(`---
foo:
  bar:
    enum: [
      "abc",
      "cde"
    ]`),
    ).toEqual([
      {
        foo: {
          bar: {
            enum: ['abc', 'cde'],
          },
        },
      },
    ]);
  });

  it('Succeeds even if keys are not unique', () => {
    expect(
      parseFileContent(`---
    foo: "bar"
    "foo": "baz"`),
    ).toEqual([
      {
        foo: 'baz',
      },
    ]);
  });

  it('Succeeds for valid YAML', () => {
    expect(
      parseFileContent(`---
foo: "bar"`),
    ).toEqual([
      {
        foo: 'bar',
      },
    ]);
  });

  it('Succeeds for valid multi-file YAML', () => {
    expect(
      parseFileContent(`---
foo: "bar"
---
foo: "baz"`),
    ).toEqual([
      {
        foo: 'bar',
      },
      {
        foo: 'baz',
      },
    ]);
  });

  it('Succeeds for valid JSON', () => {
    expect(parseFileContent('{"foo": "bar"}')).toEqual([
      {
        foo: 'bar',
      },
    ]);
  });

  it('Fails for invalid JSON', () => {
    expect(() => {
      parseFileContent('{"foo": "bar"');
    }).toThrowError('Expected flow map to end with }');
  });
});
