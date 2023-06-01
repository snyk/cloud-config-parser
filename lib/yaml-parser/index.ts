import * as YAML from 'yaml';

export type ParserFileType = 'json' | 'yaml' | 'yml';

export function parseFileContent(
  fileContent: string,
  fileType: ParserFileType = 'yaml',
): any[] {
  // the YAML library can parse both YAML and JSON content, as well as content with singe/multiple YAMLs
  // but the YAML library uses a lot of memory which could cause the Node heap to run out of memory: https://snyk.zendesk.com/agent/tickets/35401
  if (fileType === 'json') {
    return [JSON.parse(fileContent)];
  }

  const documents = YAML.parseAllDocuments(fileContent) as YAML.Document.Parsed<
    YAML.ParsedNode
  >[];

  return documents.map((doc) => {
    if (shouldThrowErrorFor(doc)) {
      throw doc.errors[0];
    }
    if (showThrowWarningFor(doc)) {
      throw doc.warnings[0];
    }
    return doc.toJSON();
  });
}

function shouldThrowErrorFor(doc: YAML.Document.Parsed) {
  const errorsToSkip = [
    'Insufficient indentation in flow collection',
    'Map keys must be unique',
  ];
  return (
    doc.errors.length !== 0 &&
    !errorsToSkip.some((e) => doc.errors[0].message.includes(e))
  );
}

function showThrowWarningFor(doc: YAML.Document.Parsed) {
  const warningsToInclude = [
    'Keys with collection values will be stringified as YAML due to JS Object restrictions. Use mapAsMap: true to avoid this.',
  ];
  return (
    doc.warnings.length !== 0 &&
    warningsToInclude.some((e) => doc.warnings[0].message.includes(e))
  );
}
