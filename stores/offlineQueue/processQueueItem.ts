import type { QueueFlushContext, QueueItemResult } from './flushTypes'
import { handleCategoryQueueItem } from './handlers/categories'
import { handleStatementQueueItem } from './handlers/statements'
import { handleMiscQueueItem } from './handlers/misc'

export const processQueueItem = async (
  context: QueueFlushContext,
): Promise<QueueItemResult> => {
  const categoryResult = await handleCategoryQueueItem(context)
  if (categoryResult) return categoryResult

  const statementResult = await handleStatementQueueItem(context)
  if (statementResult) return statementResult

  const miscResult = await handleMiscQueueItem(context)
  if (miscResult) return miscResult

  return 'deferred'
}
