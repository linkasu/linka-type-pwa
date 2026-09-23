import { normalizeStatementText, summarizeStatementReplace } from '~/utils/statementText'

describe('statement text normalization', () => {
  it('normalizes line endings, whitespace and exact duplicates', () => {
    expect(normalizeStatementText(' first\r\n\r second \rfirst\nFIRST\r\n')).toEqual({
      texts: ['first', 'second', 'FIRST'],
      duplicates: 1,
    })
  })

  it('summarizes a full category replacement', () => {
    const current = [
      { id: 'one', categoryId: 'cat', text: 'one', created: 1 },
      { id: 'two', categoryId: 'cat', text: 'two', created: 2 },
    ]
    expect(summarizeStatementReplace(current, ['two', 'three'], 1)).toEqual({
      added: 1,
      kept: 1,
      removed: 1,
      duplicates: 1,
      total: 2,
    })
  })
})
