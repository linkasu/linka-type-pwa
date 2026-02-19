import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import ts from 'typescript'

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.vue'])
const IGNORE_DIRS = new Set(['node_modules', '.output', '.nuxt', 'dist', '.git'])
const TS_SCRIPT_LANG_RE = /\blang\s*=\s*['"](ts|tsx)['"]/i

interface Violation {
  path: string
  line: number
  column: number
}

function getFiles(dir: string): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stats = statSync(fullPath)

    if (stats.isDirectory()) {
      if (!IGNORE_DIRS.has(entry)) {
        files.push(...getFiles(fullPath))
      }
      continue
    }

    if (!stats.isFile()) {
      continue
    }

    const extension = extname(entry)
    if (SUPPORTED_EXTENSIONS.has(extension)) {
      files.push(fullPath)
    }
  }

  return files
}

function getScriptKind(filePath: string): ts.ScriptKind {
  const extension = extname(filePath)
  if (extension === '.tsx') {
    return ts.ScriptKind.TSX
  }
  return ts.ScriptKind.TS
}

function countLinesBeforeIndex(content: string, endIndex: number): number {
  let lines = 0
  for (let index = 0; index < endIndex; index += 1) {
    if (content[index] === '\n') {
      lines += 1
    }
  }
  return lines
}

function findAnyInTs(
  content: string,
  filePath: string,
  lineOffset = 0,
): Violation[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath),
  )
  const violations: Violation[] = []

  function visit(node: ts.Node): void {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
      violations.push({
        path: filePath,
        line: position.line + lineOffset + 1,
        column: position.character + 1,
      })
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return violations
}

function findAnyInVue(content: string, filePath: string): Violation[] {
  const scriptTagRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
  const violations: Violation[] = []

  let match = scriptTagRegex.exec(content)
  while (match) {
    const attributes = match[1] ?? ''
    if (TS_SCRIPT_LANG_RE.test(attributes)) {
      const scriptBody = match[2] ?? ''
      const fullMatch = match[0]
      const scriptBodyOffset = fullMatch.indexOf(scriptBody)
      const startIndex = (match.index ?? 0) + scriptBodyOffset
      const lineOffset = countLinesBeforeIndex(content, startIndex)

      violations.push(...findAnyInTs(scriptBody, filePath, lineOffset))
    }

    match = scriptTagRegex.exec(content)
  }

  return violations
}

function main(): void {
  const rootDir = process.cwd()
  const files = getFiles(rootDir)
  const violations: Violation[] = []

  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    const extension = extname(file)
    if (extension === '.vue') {
      violations.push(...findAnyInVue(content, file))
    } else {
      violations.push(...findAnyInTs(content, file))
    }
  }

  violations.sort((first, second) => {
    if (first.path === second.path) {
      if (first.line === second.line) {
        return first.column - second.column
      }
      return first.line - second.line
    }
    return first.path.localeCompare(second.path)
  })

  if (violations.length === 0) {
    console.log('No explicit `any` usages found.')
    process.exit(0)
  }

  console.error('Explicit `any` is forbidden. Found:')
  for (const violation of violations) {
    const relativePath = relative(rootDir, violation.path)
    console.error(`  ${relativePath}:${violation.line}:${violation.column}`)
  }
  process.exit(1)
}

main()
