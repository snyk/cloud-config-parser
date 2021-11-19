import { parseFileContent } from '../../lib';
import { issuesToLineNumbers } from '../../lib/issue-to-line';
import { CloudConfigFileTypes } from '../../lib/types';

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
});

describe('parseFileContent', () => {
  it('Throws an error if it contains \\/', () => {
    /* eslint-disable no-useless-escape */
    expect(() => {
      parseFileContent(`{
  "foo": "\\/"
}`);
    }).toThrowError('Found escape character \\/.');
    /* eslint-enable no-useless-escape */
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

  it('Parses Helm template call', async () => {
    expect(
      parseFileContent(`---
name: {{ .Values.something.name }}
        `),
    ).toEqual([
      {
        name: '{{ .Values.something.name }}',
      },
    ]);
  });
});
