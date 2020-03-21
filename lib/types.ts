export enum CloudConfigFileTypes {
  YAML = 1,
  JSON,
}

export interface Tree {
  node: Node[];
}

export interface TreesMap {
  [index: number]: Tree;
}

interface LineLocation {
  line: number;
  columnStart: number;
  columnEnd: number;
}

export interface Node {
  key: string;
  lineLocation: LineLocation;
  values: Node[] | string;
}

export interface PathDetails {
  DocId: number;
  Path: string[];
}
