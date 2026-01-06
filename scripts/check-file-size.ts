import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const MAX_LINES = 200
const EXTENSIONS = ['.ts', '.vue', '.js', '.mjs']
const IGNORE_DIRS = ['node_modules', '.output', '.nuxt', 'dist', '.git']

interface FileInfo {
  path: string
  lines: number
}

function getFiles(dir: string, rootDir: string): FileInfo[] {
  const results: FileInfo[] = []

  const items = readdirSync(dir)
  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(item)) {
        results.push(...getFiles(fullPath, rootDir))
      }
    } else if (stat.isFile()) {
      const ext = item.slice(item.lastIndexOf('.'))
      if (EXTENSIONS.includes(ext)) {
        const content = readFileSync(fullPath, 'utf-8')
        const lines = content.split('\n').length
        results.push({
          path: relative(rootDir, fullPath),
          lines,
        })
      }
    }
  }

  return results
}

function main() {
  const rootDir = process.cwd()
  const files = getFiles(rootDir, rootDir)
  const violations = files.filter(f => f.lines > MAX_LINES).sort((a, b) => b.lines - a.lines)

  if (violations.length === 0) {
    console.log(`All files are within ${MAX_LINES} lines limit.`)
    process.exit(0)
  }

  console.log(`Found ${violations.length} file(s) exceeding ${MAX_LINES} lines:\n`)
  for (const file of violations) {
    const excess = file.lines - MAX_LINES
    console.log(`  ${file.path}: ${file.lines} lines (+${excess})`)
  }

  console.log(`\nTotal violations: ${violations.length}`)
  process.exit(1)
}

main()

