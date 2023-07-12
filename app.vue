<script lang="ts" setup>
import { Toaster } from 'vue-sonner'

useHead({
    link: [
        {
            rel: 'icon',
            type: 'image/svg+xml',
            href: 'https://api.iconify.design/tabler:swords.svg',
        },
    ],
    title: 'Prompts Royale • Compare GPT prompts',
})
</script>

<template>
    <div>
        <UContainer>
            <NuxtLayout />
        </UContainer>
        <ClientOnly>
            <Toaster position="top-right" />
        </ClientOnly>
    </div>
</template>

<style>
body {
    -webkit-font-smoothing: antialiased;
    font-smooth: antialiased;
    margin: 0;
}

* {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    /* outline: 1px solid red; */
}
</style>
