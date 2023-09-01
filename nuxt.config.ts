export default defineNuxtConfig({
    devtools: { enabled: true },
    modules: [
        '@unocss/nuxt',
        '@nuxthq/ui',
        '@vueuse/nuxt',
        '@vueuse/motion/nuxt',
    ],
    unocss: {
        attributify: true,
        icons: true,
    },
    colorMode: {
        preference: 'light',
    },
    build: {
        transpile: ['vue-sonner', '@web-std/stream'],
    },
})
