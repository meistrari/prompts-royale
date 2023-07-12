<script lang="ts" setup>
const { battles, clearBattles } = useAutoPrompter()

const battleItemList = computed(() => battles.value
    .filter(({ winner }) => winner)
    .reverse(),
)
</script>

<template>
    <ClientOnly>
        <template #placeholder>
            <USkeleton w-full h-full />
        </template>
        <UCard
            v-if="battleItemList.length > 0"
            h-40dvh
            overflow-y-auto
        >
            <template #header>
                <div flex items-center>
                    <div font-bold text-5>
                        Battle log
                    </div>
                    <UButton ms-auto icon="i-tabler-trash text-red" color="white" @click="clearBattles">
                        Clear battles
                    </UButton>
                </div>
            </template>

            <div>
                <div
                    v-for="battle in battleItemList"
                    :key="JSON.stringify(battle)"
                    mb-1 last:mb-0
                >
                    <UPopover :ui="{ container: 'z-5555' }">
                        <UButton color="white" icon="i-tabler-swords" w-full>
                            <div flex gap-1>
                                <span
                                    :class="[
                                        battle.winner === 'a' && 'text-emerald-7 font-bold',
                                    ]"
                                >
                                    Prompt #{{ battle.a + 1 }}
                                </span>
                                <span>vs</span>
                                <span
                                    :class="[
                                        battle.winner === 'b' && 'text-emerald-7 font-bold',
                                    ]"
                                >
                                    Prompt #{{ battle.b + 1 }}
                                </span>
                            </div>
                            <template #trailing>
                                <UBadge ms-auto size="xs">
                                    {{ battle.rounds.length }} rounds
                                </UBadge>
                                <UBadge v-if="battle.winner === 'draw'" size="xs" color="orange">
                                    Draw
                                </UBadge>
                            </template>
                        </UButton>

                        <template #panel>
                            <div
                                w-120
                                h-100 overflow-y-auto
                                px-4 py-2
                            >
                                <div
                                    v-for="(round, i) in battle.rounds"
                                    :key="round.testCase"
                                    p-2 rounded mb-2 last:mb-0
                                    u-ring-1 ring-gray-2
                                >
                                    <div flex="~ col" gap-1>
                                        <div font-bold uppercase op-60 text-sm mb-2>
                                            Round {{ i + 1 }}
                                        </div>
                                    </div>
                                    <div p-2 bg="gray-1" rounded>
                                        <div>
                                            {{ round.testCase }}
                                        </div>
                                        <div text-xs uppercase text-right>
                                            Test case
                                        </div>
                                    </div>
                                    <div
                                        p-2 rounded mt-1 :class="[
                                            round.result === 'a' && 'bg-emerald-1',
                                            round.result === 'b' && 'bg-red-1',
                                            round.result === 'draw' && 'bg-blue-1',
                                        ]"
                                    >
                                        <div>
                                            {{ round.generation.a }}
                                        </div>
                                        <div text-xs uppercase text-right>
                                            Prompt #{{ battle.a + 1 }}
                                        </div>
                                    </div>
                                    <div
                                        p-2 rounded mt-1 :class="[
                                            round.result === 'b' && 'bg-emerald-1',
                                            round.result === 'a' && 'bg-red-1',
                                            round.result === 'draw' && 'bg-blue-1',
                                        ]"
                                    >
                                        <div>
                                            {{ round.generation.b }}
                                        </div>
                                        <div text-xs uppercase text-right>
                                            Prompt #{{ battle.b + 1 }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </UPopover>
                </div>
            </div>
        </UCard>
    </ClientOnly>
</template>
