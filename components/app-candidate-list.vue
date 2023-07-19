<script lang="ts" setup>
const { candidates, expectedScore } = useAutoPrompter()

const candidateItemList = computed(() => {
    const sorted = candidates.value
        .map((c, i) => ({
            label: `Prompt #${i + 1}`,
            content: `Rating: ${c.rating}\nSD:${c.sd}\n${c.content}`,
            rating: c.rating,
            icon: 'i-tabler-3d-cube-sphere',
            isBest: false,
            id: c.id,
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
    <UCard
        h-full
        :ui="{
            base: 'overflow-y-auto',
        }"
    >
        <template #header>
            <div font-bold text-5>
                Prompt candidates {{ candidateItemList.length }}
            </div>
        </template>

        <div mb-4>
            <CandidateListActions w-full />
        </div>
        <ClientOnly>
            <div>
                <CandidateListItem
                    v-for="item in candidateItemList"
                    :key="item.id + item.rating"
                    :prompt-id="item.id"
                    :score="item.score"
                    mb-2 last:mb-0
                />
            </div>

            <template #placeholder>
                <USkeleton v-for="i in 4" :key="i" w-full h-60 mb-4 />
            </template>
        </ClientOnly>
    </UCard>
</template>
