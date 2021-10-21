import * as peggy from 'peggy';

const grammar = `
// Documentation, specifically for parsing delimited lists.
// https://peggyjs.org/documentation#parsing-lists

// A path is a dot delimeted list of identifiers.
path = head:segment tail:("." @segment)* { return [head, ...tail]; }

// Segments consist of an identifier and an optional index.
// e.g. hello or hello[world]
segment = $(identifier index?)

// An identifier is a string of consecutive characters not consisting of dots, quotes or brackets. 
identifier = [^'"\\[\\]\\.]+

// An index consists of square brackets containing a quoted or unquoted value.
// e.g. hello['world'] or hello[world]
index = "[" $( unquoted_index / single_quoted_index / double_quoted_index) "]"

unquoted_index = [^'"\\]\\[]+
single_quoted_index = "'" [^']+ "'"
double_quoted_index = '"' [^"]+ '"'
`;

export const parsePath = createPathParser();

function createPathParser(): (expr: string) => string[] {
  const parser = peggy.generate(grammar);
  return (expr: string) => {
    try {
      return parser.parse(expr);
    } catch (e) {
      return expr.split('.');
    }
  };
}
