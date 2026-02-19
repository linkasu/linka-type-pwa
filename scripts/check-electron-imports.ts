import { existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import ts from 'typescript'

const ROOT_DIR = process.cwd()
const ELECTRON_DIR = join(ROOT_DIR, 'electron')
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts'])
const ALLOWED_IMPORT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.json', '.node'])

interface Violation {
  file: string
  line: number
  column: number
  specifier: string
  message: string
}

function collectSourceFiles(dir: string): string[] {
  const files: string[] = []
  const entries = readdirSync(dir)

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stats = statSync(fullPath)

    if (stats.isDirectory()) {
      files.push(...collectSourceFiles(fullPath))
      continue
    }

    if (!stats.isFile()) {
      continue
    }

    if (SOURCE_EXTENSIONS.has(extname(fullPath))) {
      files.push(fullPath)
    }
  }

  return files
}

function buildResolutionCandidates(importerFile: string, specifier: string): string[] {
  const resolved = resolve(dirname(importerFile), specifier)
  const extension = extname(resolved)
  const candidates = [resolved]

  if (extension === '.js') {
    candidates.push(
      resolved.slice(0, -3) + '.ts',
      resolved.slice(0, -3) + '.tsx',
      resolved.slice(0, -3) + '.mts',
      resolved.slice(0, -3) + '.cts',
    )
  } else if (extension === '.mjs') {
    candidates.push(resolved.slice(0, -4) + '.mts')
  } else if (extension === '.cjs') {
    candidates.push(resolved.slice(0, -4) + '.cts')
  }

  return candidates
}

function checkSpecifier(
  sourceFile: ts.SourceFile,
  importerFile: string,
  specifier: string,
  node: ts.Node,
  violations: Violation[],
): void {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
    return
  }

  const extension = extname(specifier)
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  const relativePath = relative(ROOT_DIR, importerFile)

  if (!ALLOWED_IMPORT_EXTENSIONS.has(extension)) {
    violations.push({
      file: relativePath,
      line: position.line + 1,
      column: position.character + 1,
      specifier,
      message: 'Relative ESM import must include explicit runtime extension (.js/.mjs/.cjs).',
    })
    return
  }

  const candidates = buildResolutionCandidates(importerFile, specifier)
  if (!candidates.some(candidate => existsSync(candidate))) {
    violations.push({
      file: relativePath,
      line: position.line + 1,
      column: position.character + 1,
      specifier,
      message: 'Import target does not exist on disk.',
    })
  }
}

function lintFile(filePath: string): Violation[] {
  const content = ts.sys.readFile(filePath) ?? ''
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const violations: Violation[] = []

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      checkSpecifier(sourceFile, filePath, node.moduleSpecifier.text, node.moduleSpecifier, violations)
    }

    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      checkSpecifier(sourceFile, filePath, node.moduleSpecifier.text, node.moduleSpecifier, violations)
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      checkSpecifier(sourceFile, filePath, node.arguments[0].text, node.arguments[0], violations)
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function main(): void {
  if (!existsSync(ELECTRON_DIR)) {
    console.error('Missing electron directory.')
    process.exit(1)
  }

  const files = collectSourceFiles(ELECTRON_DIR)
  const violations = files.flatMap(lintFile).sort((first, second) => {
    if (first.file === second.file) {
      if (first.line === second.line) {
        return first.column - second.column
      }
      return first.line - second.line
    }
    return first.file.localeCompare(second.file)
  })

  if (violations.length === 0) {
    console.log('Electron import checks passed.')
    process.exit(0)
  }

  console.error('Electron import checks failed:')
  for (const violation of violations) {
    console.error(
      `  ${violation.file}:${violation.line}:${violation.column} ${violation.message} (${violation.specifier})`,
    )
  }
  process.exit(1)
}

main()
