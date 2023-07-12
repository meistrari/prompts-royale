<script lang="ts" setup>
const { apiKey } = useSettings()
const { cost } = useAI()
</script>

<template>
    <div
        flex items-center
        py-4
    >
        <Logo />
        <div>
            <ClientOnly>
                <UPopover ml-5>
                    <UButton
                        variant="ghost" icon="i-tabler-key" :class="[
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
        <UButton icon="i-tabler-settings" ms-auto @click="navigateTo('/settings')">
            Settings
        </UButton>
        <ClientOnly>
            <UBadge size="lg" color="emerald" ms-2>
                <UIcon name="i-tabler-currency-dollar" />
                {{ (cost || 0).toFixed(3) }}
            </UBadge>

            <template #placeholder>
                <USkeleton w-20 h-8 ml-4 />
            </template>
        </ClientOnly>
    </div>
</template>
