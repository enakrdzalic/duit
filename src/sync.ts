import { supabase } from './lib/supabase'
import { emptyState, migrateState } from './storage'
import type { AppState } from './types'

export type RemoteAppState = {
  data: AppState
  updatedAt: string | null
}

export async function fetchRemoteState(
  userId: string,
): Promise<RemoteAppState | null> {
  const { data, error } = await supabase
    .from('app_state')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    data: migrateState(data.data),
    updatedAt: data.updated_at ?? null,
  }
}

export async function upsertRemoteState(
  userId: string,
  state: AppState,
): Promise<string> {
  const updatedAt = new Date().toISOString()
  const { error } = await supabase.from('app_state').upsert(
    {
      user_id: userId,
      data: state,
      updated_at: updatedAt,
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
  return updatedAt
}

export function hasLocalContent(state: AppState): boolean {
  return state.tasks.length > 0 || state.categories.length > 0
}

export { emptyState }
