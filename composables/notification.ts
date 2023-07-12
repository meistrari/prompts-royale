import type { toast } from 'vue-sonner'

export function useNotification() {
    const app = useNuxtApp()

    return app.$toast as typeof toast
}
