import { mapReplacementDraftIds } from '~/stores/offlineQueue/handlers/statements'
import { addConflictOnce } from '~/stores/offlineQueue/handlers/utils'
import type { SyncConflict } from '~/types/offline'

describe('offline queue reliability', () => {
  it('remaps repeated statement text by occurrence', () => {
    const drafts = [
      { id: 'draft-1', categoryId: 'cat', text: 'same', created: 1 },
      { id: 'draft-2', categoryId: 'cat', text: 'same', created: 2 },
    ]
    const statements = [
      { id: 'server-1', categoryId: 'cat', text: 'same', created: 3 },
      { id: 'server-2', categoryId: 'cat', text: 'same', created: 4 },
    ]

    expect(mapReplacementDraftIds(drafts, statements)).toEqual([
      ['draft-1', 'server-1'],
      ['draft-2', 'server-2'],
    ])
  })

  it('keeps one conflict per persisted queue item', () => {
    const conflict = {
      id: 'conflict-1',
      entityType: 'statement',
      entityId: 'statement-1',
      conflictType: 'update_update',
      localChange: {
        id: 7,
        userId: 'user-1',
        op: 'statement_update',
        payload: { id: 'statement-1', text: 'local' },
        createdAt: 1,
      },
      createdAt: 1,
    } satisfies SyncConflict
    const conflicts: SyncConflict[] = []

    addConflictOnce(conflicts, conflict)
    addConflictOnce(conflicts, { ...conflict, id: 'conflict-2' })

    expect(conflicts).toHaveLength(1)
  })
})
