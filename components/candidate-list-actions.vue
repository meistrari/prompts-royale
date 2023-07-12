<script lang="ts" setup>
const { clearCandidates, candidates, createEmptyCandidate, generatePromptCandidates, isGeneratingPromptCandidates } = useAutoPrompter()

const isGeneratingCandidatesModalOpen = ref(false)
const promptAmount = ref(5)

function onGeneratePromptCandidates() {
    generatePromptCandidates(promptAmount.value)
    isGeneratingCandidatesModalOpen.value = false
}
const isConfirmClearModalOpen = ref(false)

function onClearCandidates() {
    clearCandidates()
    isConfirmClearModalOpen.value = false
}
</script>

<template>
    <div>
        <UButtonGroup size="sm">
            <UButton icon="i-tabler-plus text-green" color="white" @click="createEmptyCandidate">
                Add new
            </UButton>

            <UButton icon="i-tabler-sparkles text-indigo" color="white" grow :loading="isGeneratingPromptCandidates" @click="isGeneratingCandidatesModalOpen = true">
                Generate prompts
            </UButton>

            <UButton v-if="candidates.length" icon="i-tabler-trash text-red" color="white" @click="isConfirmClearModalOpen = true">
                Clear
            </UButton>
        </UButtonGroup>

        <UModal
            v-model="isConfirmClearModalOpen"
        >
            <div p-4>
                <div text-xl font-bold>
                    Do you really want to clear all candidates?
                </div>
                <div text-lg op-70 mt-2>
                    This will also clear all battles and ratings.
                </div>
                <div flex justify-end gap-2 mt-6>
                    <UButton color="white" size="lg" @click="isConfirmClearModalOpen = false">
                        Cancel
                    </UButton>
                    <UButton color="red" size="lg" @click="onClearCandidates">
                        Clear
                    </UButton>
                </div>
            </div>
        </UModal>

        <UModal v-model="isGeneratingCandidatesModalOpen">
            <div p-4>
                <div text-2xl font-bold>
                    Generating prompt candidates
                </div>
                <div text-lg op-70 mt-2>
                    How many prompt candidates do you want to generate? A total of 10 is recommended.
                </div>
                <UInput
                    v-model="promptAmount"
                    variant="outline"
                    type="number"
                    placeholder="5"
                    size="xl"
                    my-4
                    @keyup.enter="onGeneratePromptCandidates"
                />
                <div flex justify-end gap-2 mt-6>
                    <UButton color="white" size="lg" @click="isGeneratingCandidatesModalOpen = false">
                        Cancel
                    </UButton>
                    <UButton color="indigo" size="lg" @click="onGeneratePromptCandidates">
                        Generate
                    </UButton>
                </div>
            </div>
        </UModal>
    </div>
</template>
