import type { Statement, StatementReplaceSummary } from '~/types/api'

export const normalizeStatementText = (raw: string) => {
  const seen = new Set<string>()
  const texts: string[] = []
  let duplicates = 0

  for (const line of raw.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n')) {
    const text = line.trim()
    if (!text) continue
    if (seen.has(text)) {
      duplicates += 1
      continue
    }
    seen.add(text)
    texts.push(text)
  }

  return { texts, duplicates }
}

export const summarizeStatementReplace = (
  current: Statement[],
  texts: string[],
  duplicates: number,
): StatementReplaceSummary => {
  const available = new Map<string, number>()
  for (const statement of current) {
    available.set(statement.text, (available.get(statement.text) ?? 0) + 1)
  }

  let kept = 0
  for (const text of texts) {
    const count = available.get(text) ?? 0
    if (count > 0) {
      kept += 1
      available.set(text, count - 1)
    }
  }

  return {
    added: texts.length - kept,
    kept,
    removed: current.length - kept,
    duplicates,
    total: texts.length,
  }
}
