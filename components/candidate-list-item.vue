<script lang="ts" setup>
const props = defineProps<{
    promptId: number
    score: number
}>()

const { candidates, removeCandidate, battlesToRun } = useAutoPrompter()

const promptIndex = computed(() =>
    candidates.value.findIndex(({ id }) => id === props.promptId),
)

function getScoreColor(score: number) {
    if (score > 80)
        return 'bg-emerald-1 ring-emerald-6 text-emerald-7'
    if (score >= 50)
        return 'bg-orange-1 ring-orange-6 text-orange-7'
    return 'bg-red-1 ring-red-6 text-red-7'
}

function getRingColor(score: number) {
    if (score > 80)
        return 'ring-emerald-3'
    if (score >= 50)
        return 'ring-orange-3'
    return 'ring-red-3'
}

const textareaEl = ref<HTMLTextAreaElement | null>(null)
onMounted(() => {
    if (textareaEl.value)
        textareaEl.value.style.height = 'auto'
})

const isDeleteCandidateModalOpen = ref(false)
function onDeleteCandidate() {
    removeCandidate(props.promptId)
    isDeleteCandidateModalOpen.value = false
}
</script>

<template>
    <div
        v-if="promptIndex > -1"
        u-ring-2 p-2 rounded
        flex="~ col" gap-2
        :class="getRingColor(score)"
    >
        <!-- Header -->
        <div flex cursor-pointer hover:bg-gray-50 px-2 py-1 rounded items-center>
            <div font-bold>
                Prompt #{{ promptId + 1 }}
            </div>
            <UTooltip text="Indexed Strength Score" ms-auto>
                <div
                    items-center size="md" flex gap-1
                    px-2 py-0.5 rounded u-ring-1
                    :class="[
                        getScoreColor(score),
                    ]"
                >
                    <UIcon name="i-tabler-trophy" />
                    <div>
                        {{ score.toFixed(0) }}
                    </div>
                </div>
            </UTooltip>
            <UButton square color="black" icon="i-tabler-trash" ms-2 @click="isDeleteCandidateModalOpen = true" />
        </div>

        <!-- Content -->
        <div v-if="battlesToRun <= 0">
            <UTextarea v-model="candidates[promptIndex].content" autoresize />
        </div>

        <!-- Confirm candidate deletion -->
        <UModal
            v-model="isDeleteCandidateModalOpen"
        >
            <div p-4>
                <div text-xl font-bold>
                    Do you really want delete Prompt #{{ promptId + 1 }}?
                </div>
                <div text-lg op-70 mt-2>
                    This will also clear all battles and it's position in the ratings history.
                </div>
                <div flex justify-end gap-2 mt-6>
                    <UButton color="white" size="lg" @click="isDeleteCandidateModalOpen = false">
                        Cancel
                    </UButton>
                    <UButton color="red" size="lg" icon="i-tabler-trash" @click="onDeleteCandidate()">
                        Delete
                    </UButton>
                </div>
            </div>
        </UModal>
    </div>
</template>
