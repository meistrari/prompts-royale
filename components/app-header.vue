<script lang="ts" setup>
const { apiKey } = useSettings()
const { cost } = useAI()
</script>

<template>
    <div
        flex items-center
        p-4
    >
        <Logo />
        <div>
            <ClientOnly>
                <UPopover ml-5>
                    <UButton
                        icon="i-tabler-key text-5" :class="[
                            !apiKey && 'animate-bounce',
                        ]"
                    >
                        API Key
                    </UButton>
                    <template #panel>
                        <div flex="~ col" gap-2 p-4>
                            <div font-bold text-5>
                                OpenAI API Key
                            </div>
                            <ClientOnly>
                                <div w-100>
                                    <UInput
                                        v-model="apiKey"
                                        placeholder="Your API key"
                                        type="password"
                                    />
                                </div>
                                <template #placeholder>
                                    <USkeleton w-full h-10 my-2 />
                                </template>
                            </ClientOnly>
                        </div>
                    </template>
                </UPopover>
                <template #placeholder>
                    <USkeleton w-20 h-8 ml-4 />
                </template>
            </ClientOnly>
        </div>
        <UButton icon="i-tabler-settings text-5" ms-auto color="white" @click="navigateTo('/settings')">
            Settings
        </UButton>
        <ClientOnly>
            <div class="bg-emerald-2/30 ring-emerald-5/50 text-emerald-7" font-bold ms-2 py-1 px-2 flex items-center u-ring-1 rounded>
                <UIcon name="i-tabler-currency-dollar text-4.5" />
                {{ (cost || 0).toFixed(3) }}
            </div>

            <template #placeholder>
                <USkeleton w-20 h-8 ml-4 />
            </template>
        </ClientOnly>
        <a href="https://github.com/meistrari/prompts-royale" ms-2>
            <UButton icon="i-tabler-brand-github text-5" color="black">
                Github
            </UButton>
        </a>
    </div>
</template>
