const plugin = require('../')
const {expect} = require('chai')
const makeTest = ({resolveId}) => (importee, importer, expected, name = '') => {
  it(`${name}${name ? ' (' : ''}${importer}: import ${importee} => ${expected}${name ? ')' : ''}`, async () => {
    expect(await resolveId(importee, importer)).to.equal(expected)
  })
}

describe('ignored paths', () => {
  const test = makeTest(plugin({
    baseDir: '/root',
    map: {
      "imports": {
        "\0a": "/a-1.mjs",
        "./a": "/a-1.mjs",
        "/foo/bar": "/a-1.mjs",
        "https://foo.com/bar": "/a-1.mjs",
        "about:bad": "/a-1.mjs",
        "mailto:bad": "/a-1.mjs",
        ":bad": "/a-1.mjs",
      }
    }
  }))
  test('foo', null, null, 'ignores initial imports')
  test('\0a', '/scope1', null, 'ignores rollup internal modules')
  test('./a', '/scope1', null, 'ignores relative path identifiers')
  test('../a', '/scope1', null, 'ignores relative path identifiers')
  test('/foo/bar', '/scope1', null, 'ignores absolute path identifiers')
  test('https://foo.com/bar', '/scope1', null, 'ignores urls')
  test('about:bad', '/scope1', null, 'ignores scheme urls')
  test('mailto:bad', '/scope1', null, 'ignores scheme urls')
  test(':bad', '/scope1', null, 'ignores unparseable urls')
})

describe('empty modules', () => {
  const test = makeTest(plugin({
    baseDir: '/root',
    map: {
      "imports": {
        "foo": [],
        "bar": null
      }
    }
  }))
  test('foo', '/scope1', null)
  test('bar', '/scope1', null)
})

describe('basic mapping', () => {
  const test = makeTest(plugin({
    baseDir: '/root',
    map: {
      "imports": {
        "a": "/a-1.mjs",
        "b": "/b-1.mjs",
        "c": "/c-1.mjs",
      },
    }
  }))
  test('a', '/root/foo', '/root/a-1.mjs')
  test('b', '/root/foo', '/root/b-1.mjs')
  test('c', '/root/foo', '/root/c-1.mjs')
})

describe('directory mapping', () => {
  const test = makeTest(plugin({
    baseDir: '/root',
    map: {
      "imports": {
        "module/": "/node_modules/module/",
      }
    }
  }))
  test('module/a', '/root/scope1', '/root/node_modules/module/a')
  test('module/a', '/root/scope1', '/root/node_modules/module/a')
  test('not-a-module/a', '/root/scope1', null)
})

describe('tricky specifiers', () => {
  const test = makeTest(plugin({
    baseDir: '/root',
    map: {
      "imports": {
        "package/withslash": "/node_modules/package-with-slash/index.js",
        "%2E": "/lib/percent2e.mjs",
        "%2F": "/lib/percent2f.mjs",
      }
    }
  }))
  test('package/withslash', '/root/scope1', '/root/node_modules/package-with-slash/index.js')
  test('%2E', '/root/scope1', '/root/lib/percent2e.mjs')
  test('%2F', '/root/scope1', '/root/lib/percent2f.mjs')
})

describe('overlapping entries with trailing slashes', () => {
  const test = makeTest(plugin({
    baseDir: '/root',
    map: {
      "imports": {
        "a": "/1",
        "a/": "/2/",
        "a/b": "/3",
        "a/b/": "/4/"
      }
    }
  }))
  test('a', '/root', '/root/1')
  test('a/', '/root', '/root/2/')
  test('a/b', '/root', '/root/3')
  test('a/b/', '/root', '/root/4/')
  test('a/b/c', '/root', '/root/4/c')
})

describe('overlapping entries with trailing slashes and empty modules', () => {
  const test = makeTest(plugin({
    baseDir: '/root',
    map: {
      "imports": {
        "a": "/1",
        "a/": "/2/",
        "a/b": [],
        "a/b/": []
      }
    }
  }))
  test('a', '/root', '/root/1')
  test('a/', '/root', '/root/2/')
  test('a/x', '/root', '/root/2/x')
  test('a/b', '/root', null)
  test('a/b/', '/root', null)
  test('a/b/c', '/root', null)
  test('a/x/c', '/root', '/root/2/x/c')
})
