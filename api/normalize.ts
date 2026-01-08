import type { Category, Statement } from '~/types/api'

type RawCategory = Partial<Category> & {
  statements_count?: number
  statementsCount?: number
  created_at?: number
  is_default?: boolean
  default?: boolean | null
}

type RawStatement = Partial<Statement> & {
  category_id?: string
  created_at?: number
}

export function normalizeCategory(raw: RawCategory): Category {
  const isDefault = raw.default ?? raw.is_default ?? false

  return {
    id: raw.id ?? '',
    label: raw.label ?? '',
    created: raw.created ?? raw.created_at ?? 0,
    default: Boolean(isDefault),
    statementsCount: raw.statementsCount ?? raw.statements_count,
  }
}

export function normalizeStatement(raw: RawStatement): Statement {
  return {
    id: raw.id ?? '',
    categoryId: raw.categoryId ?? raw.category_id ?? '',
    text: raw.text ?? '',
    created: raw.created ?? raw.created_at ?? 0,
  }
}

export function normalizeStatements(raw: RawStatement[]): Statement[] {
  return raw.map(normalizeStatement)
}
