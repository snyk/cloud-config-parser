export enum CloudConfigFileTypes {
  YAML = 1,
  JSON,
  TF,
}

export interface FileStructureTree {
  nodes: FileStructureNode[];
}

export interface MapsDocIdToTree {
  [index: number]: FileStructureTree;
}

export interface LineLocation {
  line: number;
  columnStart: number;
  columnEnd: number;
}

export interface FileStructureNode {
  key: string;
  lineLocation: LineLocation;
  values: FileStructureNode[] | string;
}

export interface PathDetails {
  docId: number;
  path: string[];
}
