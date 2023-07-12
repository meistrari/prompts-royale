<script lang="ts" setup>
const { candidates, expectedScore, resetCandidatesRatingAndSD } = useAutoPrompter()

const candidateItemList = computed(() => {
    const sorted = candidates.value
        .map((c, i) => ({
            label: `Prompt #${i + 1}`,
            content: `Rating: ${c.rating}\nSD:${c.sd}\n${c.content}`,
            rating: c.rating,
            icon: 'i-tabler-3d-cube-sphere',
            isBest: false,
            id: i,
        }))
        .sort((a, b) => b.rating - a.rating)
        .map((c, i, l) => ({
            ...c,
            label: `#${i + 1} ${c.label}`,
            isBest: i === 0,
            chanceOfWinning: i !== l.length - 1 ? 1 - expectedScore(c.rating, l[i + 1].rating) : 0,
            score: 100,
        }))

    sorted.forEach((c, i) => {
        if (i > 0)
            c.score = sorted[i - 1].score * (1 - sorted[i - 1].chanceOfWinning) / sorted[i - 1].chanceOfWinning
    })

    return sorted
})
</script>

<template>
    <ClientOnly>
        <template #placeholder>
            <USkeleton w-full h-80dvh />
        </template>
        <UCard
            h-80dvh
            :ui="{
                base: 'overflow-y-auto',
            }"
        >
            <template #header>
                <div font-bold text-5>
                    Prompt candidates
                </div>
            </template>

            <div>
                <CandidateListActions w-full mb-4 />
            </div>

            <div>
                <CandidateListItem
                    v-for="item in candidateItemList"
                    :key="item.id + item.content"
                    :prompt-id="item.id"
                    :score="item.score"
                    mb-2 last:mb-0
                />
            </div>
            <!-- <UAccordion
                :items="candidateItemList"
                multiple
            >
                <template #default="{ item, open }">
                    <UButton color="white" icon="i-tabler-3d-cube-sphere" mb-2 last:mb-0>
                        <span truncate>{{ item.label }}</span>
                        <template #trailing>
                            <UBadge ms-auto :color="item.isBest ? 'emerald' : 'primary'">
                                <UIcon name="i-tabler-trophy" mr-1 />
                                <span font-bold>
                                    {{ item.score.toFixed(0) }}
                                </span>
                            </UBadge>

                            <UIcon
                                name="i-heroicons-chevron-right-20-solid"
                                class="w-5 h-5 transform transition-transform duration-200"
                                :class="[open && 'rotate-90']"
                            />
                        </template>
                    </UButton>
                </template>

                <template #item="{ item }">
                    <UTextarea
                        v-model="candidates[item.id].content"
                        autoresize
                    />
                </template> -->
            <!-- </UAccordion> -->
        </UCard>
    </ClientOnly>
</template>
