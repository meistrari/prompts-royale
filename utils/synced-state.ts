import type { RemovableRef } from '@vueuse/core'

export function useSyncedState<T>(key: string, defaultValue: T) {
    let state: Ref<T>
    let storageState: RemovableRef<T>
    if (process.client) {
        storageState = useLocalStorage(key, defaultValue)
        state = useState(key, () => defaultValue)

        state.value = storageState.value

        watch(storageState, (newVal, oldVal) => {
            if (newVal !== oldVal)
                state.value = newVal
        })
    }
    else {
        state = useState(key, () => defaultValue)
    }

    if (!process.client)
        return state

    watch(state, (newVal, oldVal) => {
        if (newVal !== oldVal)
            storageState.value = newVal
    })

    return state
}
