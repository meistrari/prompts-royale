<script lang="ts" setup>
const { battles } = useAutoPrompter()
</script>

<template>
    <div>
        <div
            grid grid-cols-2 h-60dvh gap-4 p-4
            :class="[
                battles.length ? 'h-60dvh' : 'h-90dvh',
            ]"
        >
            <AppInputArea />
            <AppCandidateList />
        </div>

        <div px-4 py-0 grid grid-cols-12 gap-4>
            <div col-span-8>
                <ClientOnly>
                    <EloChart />
                    <template #placeholder>
                        <USkeleton w-full h-40dvh />
                    </template>
                </ClientOnly>
            </div>
            <div col-span-4>
                <ClientOnly>
                    <AppBattleList />
                    <template #placeholder>
                        <USkeleton w-full h-40dvh />
                    </template>
                </ClientOnly>
            </div>
        </div>
    </div>
</template>
