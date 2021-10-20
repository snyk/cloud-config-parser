import { parsePath } from '../../../lib/parsers/path';

describe('parsing issue path', () => {
  it.each([
    ['foo', ['foo']],
    ['foo.bar.baz', ['foo', 'bar', 'baz']],
    ['foo_1._bar2.baz3_', ['foo_1', '_bar2', 'baz3_']],
    ['foo.bar[abc].baz', ['foo', 'bar[abc]', 'baz']],
    ['foo.bar[abc.def].baz', ['foo', 'bar[abc.def]', 'baz']],
    ["foo.bar['abc.def'].baz", ['foo', "bar['abc.def']", 'baz']],
    ['foo.bar["abc.def"].baz', ['foo', 'bar["abc.def"]', 'baz']],
    ["foo.bar['abc/def'].baz", ['foo', "bar['abc/def']", 'baz']],
    ["foo.bar['abcdef'].baz", ['foo', "bar['abcdef']", 'baz']],
    ["bar['abc.def']", ["bar['abc.def']"]],
    ["fo%o.bar['ab$c/def'].baz", ['fo%o', "bar['ab$c/def']", 'baz']],
    ['foo.hello["world[\'1\']"]', ['foo', 'hello["world[\'1\']"]']],
    ['foo.hello[\'world"]]', ['foo', 'hello[\'world"]]']],
  ])('%s', (input, expected) => {
    expect(parsePath(input)).toEqual(expected);
  });
});
