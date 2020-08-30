import { FileStructureNode } from '../../types';

export interface Line {
  content: string;
  number: number;
}

export interface TFLineState {
  multiCommentLine: boolean;
  ignoredLine: boolean;
}

export interface MultiLinePhrase {
  phrase: string | null;
}

export enum TFLineTypes {
  TYPE_START = 1,
  TYPE_END,
  TYPE_START_AND_END,
  SUB_TYPE,
  STRING,
  MULTILINE_STRING,
  ARRAY_START_AND_END,
  ARRAY_START,
  ARRAY_END,
  OBJECT_START_AND_END,
  OBJECT_START,
  OBJECT_END,
  FUNCTION_START_AND_END,
  FUNCTION_START,
  FUNCTION_END,

  IGNORE = 99,
}

export interface TFState {
  structure: FileStructureNode;
  type: TFLineTypes;
}
