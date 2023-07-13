import { useCursive } from 'cursive-gpt'
import { useSettings } from './settings'
import { useSyncedState } from '@/utils/synced-state'

export function useAI() {
    const { apiKey } = useSettings()
    const cost = useSyncedState<number>('cost', 0)
    const cursive = useCursive({ apiKey: apiKey.value })
    cursive.on('completion:success', (data) => {
        cost.value += data.cost.total
    })
    return { cursive, cost }
}
