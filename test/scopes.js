const plugin = require('../')
const {expect} = require('chai')
const makeTest = ({resolveId}) => (importee, importer, expected, name = '') => {
  it(`${name}${name ? ' (' : ''}${importer}: import ${importee} => ${expected}${name ? ')' : ''}`, async () => {
    expect(await resolveId(importee, importer)).to.equal(expected)
  })
}

describe('non matching scopes', () => {
  const test = makeTest(plugin({
    baseDir: '/root',
    map: {
      "scopes": {
        "/js/": {
          "a": "/a-1.mjs",
          "b": "/b-1.mjs"
        }
      }
    }
  }))
  test('a', '/root', null)
  test('b', '/root', null)
})

describe('exact vs prefix based matching', () => {
  const test = makeTest(plugin({
    baseDir: '/root',
    map: {
      "scopes": {
        "/js": {
          "a": "/exact/a",
          "a/": "/exact/a/"
        },
        "/js/": {
          "a": "/subpath/a",
          "a/": "/subpath/a/"
        }
      }
    }
  }))
  test('a', '/root/foo', null)
  test('a/b', '/root/foo', null)
  test('a', '/root/js', '/root/exact/a')
  test('a/b', '/root/js', '/root/exact/a/b')
  test('a', '/root/js/foo', '/root/subpath/a')
  test('a/b', '/root/js/foo', '/root/subpath/a/b')
})

describe('scope mapping', () => {
  const test = makeTest(plugin({
    baseDir: '/root',
    map: {
      "imports": {
        "a": "/a-1.mjs",
        "b": "/b-1.mjs",
        "c": "/c-1.mjs",
      },
      "scopes": {
        "/scope2/": {
          "a": "/a-2.mjs"
        },
        "/scope2/scope3/": {
          "b": "/b-3.mjs"
        }
      }
    }
  }))
  test('a', '/root/scope1/foo', '/root/a-1.mjs')
  test('b', '/root/scope1/foo', '/root/b-1.mjs')
  test('c', '/root/scope1/foo', '/root/c-1.mjs')
  test('a', '/root/scope2/foo', '/root/a-2.mjs')
  test('b', '/root/scope2/foo', '/root/b-1.mjs')
  test('c', '/root/scope2/foo', '/root/c-1.mjs')
  test('a', '/root/scope2/scope3/foo', '/root/a-2.mjs')
  test('b', '/root/scope2/scope3/foo', '/root/b-3.mjs')
  test('c', '/root/scope2/scope3/foo', '/root/c-1.mjs')
})

describe('package-like scenarios', () => {
  const test = makeTest(plugin({
    baseDir: '/root',
    map: {
      "imports": {
        "a": "/node_modules/a/src/a.js",
        "a/": "/node_modules/a/src/",
        "b": "./node_modules/baz/bing.js",
        "b/": "./node_modules/baz/",
        "c": "../node_modules/baz/bing.js",
        "c/": "../node_modules/baz/"
      },
      "scopes": {
        "/": {
          "a": "/node_modules_3/a/src/a.js",
          "d": "/node_modules_3/d/dist/d.runtime.esm.js"
        },
        "/js/": {
          "b": "./node_modules_2/baz/bing.js",
          "b/": "./node_modules_2/baz/",
          "c": "../node_modules_2/baz/bing.js",
          "c/": "../node_modules_2/baz/"
        }
      }
    }
  }))

  test('b', '/root/js/foo', '/root/node_modules_2/baz/bing.js');
  test('c', '/root/js/foo', '/node_modules_2/baz/bing.js');
  test('b/foo', '/root/js/foo', '/root/node_modules_2/baz/foo');
  test('c/foo', '/root/js/foo', '/node_modules_2/baz/foo');

  test('a', '/root', '/root/node_modules_3/a/src/a.js');
  test('a', '/root/js/foo', '/root/node_modules_3/a/src/a.js');
  test('d', '/root/js/foo', '/root/node_modules_3/d/dist/d.runtime.esm.js');

  test('a/foo', '/root', '/root/node_modules/a/src/foo');
  test('a/foo', '/root/js/foo', '/root/node_modules/a/src/foo');
  test('b', '/root', '/root/node_modules/baz/bing.js');
  test('c', '/root', '/node_modules/baz/bing.js');
  test('b/foo', '/root', '/root/node_modules/baz/foo');
  test('c/foo', '/root', '/node_modules/baz/foo');

  test('e/', '/root/js/foo', null)
  test('e/foo', '/root/js/foo', null)
})
