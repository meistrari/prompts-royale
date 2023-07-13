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
    title: 'Prompts Royale • Generate and rank prompts for GPT',
    meta: [
        { property: 'og:image', content: '/og-image.png' },
    ],
})

useSeoMeta({
    ogDescription: 'Automatically generate and rank prompts for GPT',
    ogImage: '/og-image.png',
    ogUrl: 'https://promptsroyale.com',
    ogTitle: 'Prompts Royale • Generate and rank prompts for GPT',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterSite: '@henrycunh',
})

runMigrations()
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
    background: #f5f3f7;
}

* {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    /* outline: 1px solid red; */
}
</style>
