type TagTypes =
  | 'tag:yaml.org,2002:null'
  | 'tag:yaml.org,2002:str'
  | 'tag:yaml.org,2002:int'
  | 'tag:yaml.org,2002:float'
  | 'tag:yaml.org,2002:bool'
  | 'tag:yaml.org,2002:map'
  | 'tag:yaml.org,2002:seq';

interface YamlNodeElement {
  id: string;
  tag: TagTypes;
  startMark: YamlMark;
  endMark: YamlMark;
  value: string | any[] | Array<[any, any]>;
}

interface YamlMark {
  line: number;
  column: number;
  Buffer: string;
  pointer: number;
}
