const {join,dirname,relative,isAbsolute} = require('path')
const isRelative = s => s.length && s.charCodeAt(0) === 46
const isRollupInternal = s => s.length && s.charCodeAt(0) === 0
const isURL = RegExp.prototype.test.bind(/^(?:\w+:)?\/\/\S+/)
const isScheme = RegExp.prototype.test.bind(/^(?:\w+)?\:/)
const hasTail = s => s.charCodeAt(s.length - 1) === 47
const ensureTail = s => hasTail(s) ? s : `${s}/`
const ensureAbsolute = s => isAbsolute(s) ? s : `/${s}`
function * getScopes(file, baseDir) {
  let scope = baseDir ? ensureAbsolute(relative(baseDir, file)) : file
  yield scope
  while (scope !== ensureTail(dirname(scope))) {
    scope = ensureTail(dirname(scope))
    yield scope
  }
}
function getImportCandidate(scope, file) {
  if (!scope) return false
  if (typeof scope[file] === 'string') return scope[file]
  if (scope[file] === null || Array.isArray(scope[file])) return false
  for (const moduleDir of getScopes(file)) {
    if (typeof scope[moduleDir] === 'string') return `${scope[moduleDir]}${file.substr(moduleDir.length)}`
    if (scope[moduleDir] === null || Array.isArray(scope[moduleDir])) return false
  }
  return false
}

module.exports = function importMapPlugin({map, baseDir}) {
  const {imports = {}, scopes = {}} = map
  const resolveId = (importee, importer) => {
    if (
      !importer
      || isRollupInternal(importee)
      || isAbsolute(importee)
      || isRelative(importee)
      || isURL(importee)
      || isScheme(importee)
    ) return null

    let candidate
    for (const scope of getScopes(importer, baseDir)) {
      candidate = getImportCandidate(scopes[scope], importee)
      if (candidate) break
    }
    if (dirname(importer) === baseDir && scopes['']) {
      candidate = getImportCandidate(scopes[''], importee)
    }
    if (!candidate) candidate = getImportCandidate(imports, importee)
    if (candidate) {
      if (isAbsolute(candidate) || isRelative(candidate)) return join(baseDir, candidate)
      return candidate
    }
    return null
  }
  return { name: 'import-map', resolveId }
}
