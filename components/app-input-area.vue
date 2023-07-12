<script lang="ts" setup>
const {
    description,
    testCases,
    candidates,
    runNumberOfBattles,
    battlesToRun,
    stopRunningBattles,
    isGeneratingTestCases,
    generateTestCases,
} = useAutoPrompter()
const toast = useNotification()

function addTestCase() {
    testCases.value.push('')
}

function deleteTestCase(i: number) {
    testCases.value.splice(i, 1)
}

const numberOfBattles = ref(40)
async function runOrStopBattles() {
    if (battlesToRun.value > 0) {
        stopRunningBattles()
        return
    }

    if (numberOfBattles.value < 1) {
        toast.error('You need to run at least 1 battle.')
        return
    }

    if (candidates.value.length === 0) {
        toast.error('You need a list of prompt candidates first.')
        return
    }

    runNumberOfBattles(numberOfBattles.value)
}

const runBattlesText = computed(() => {
    if (battlesToRun.value <= 0)
        return `Run +${numberOfBattles.value || 0} battles`

    return `Stop battles (${battlesToRun.value} left)`
})

const isGenerateTestCasesModalOpen = ref(false)
const testCaseAmount = ref(5)

function onClickGenerateTestCases() {
    if (!description.value) {
        toast.error('You need to add a description first.')
        return
    }
    isGenerateTestCasesModalOpen.value = true
}
function onGenerateTestCases() {
    generateTestCases(testCaseAmount.value)
    isGenerateTestCasesModalOpen.value = false
}
</script>

<template>
    <div>
        <UCard
            h-80dvh :ui="{
                footer: {
                    base: 'sticky bottom-0 bg-white z-555',
                },
                body: {
                    base: 'overflow-y-auto',
                },
            }"
        >
            <template #header>
                <div font-bold text-5 sticky top-0>
                    Options
                </div>
            </template>
            <UFormGroup
                mt--2
                label="Description"
                description="Describe the task you want the AI to perform through the prompt."
                text-4.5
            >
                <ClientOnly>
                    <UTextarea
                        v-model="description"
                        variant="outline"
                        placeholder="e.g. Creates headlines from the user prompt" autoresize size="xl" mb-4
                    />
                    <template #placeholder>
                        <USkeleton w-full h-18 my-2 />
                    </template>
                </ClientOnly>
            </UFormGroup>

            <!-- Add test cases -->
            <div>
                <div text-4.5>
                    Test cases
                </div>
                <div text-sm op-50>
                    Add test cases to test the generated prompts. The prompts will be rated based on how well it performs on these test cases.
                </div>

                <ClientOnly>
                    <div v-if="testCases.length" flex="~ col" gap-2 mt-2>
                        <div v-for="_, i in testCases" :key="i" flex w-full items-start gap-2>
                            <div grow>
                                <UTextarea v-model="testCases[i]" autoresize :rows="1" size="lg" placeholder="e.g. A new fitness app called StayFit" w-full />
                            </div>
                            <UButton icon="i-tabler-trash" color="black" square size="lg" @click="deleteTestCase(i)" />
                        </div>
                    </div>
                    <template #placeholder>
                        <div flex="~ col" gap-2 mt-2>
                            <USkeleton v-for="i in 4" :key="i" w-full h-8 />
                        </div>
                    </template>
                </ClientOnly>

                <UButtonGroup>
                    <UButton icon="i-tabler-plus text-emerald" color="white" mt-2 @click="addTestCase">
                        Add test case
                    </UButton>
                    <UButton
                        icon="i-tabler-sparkles text-indigo" color="white" mt-2
                        :loading="isGeneratingTestCases"
                        @click="onClickGenerateTestCases"
                    >
                        Generate test cases
                    </UButton>
                </UButtonGroup>
            </div>

            <UModal v-model="isGenerateTestCasesModalOpen">
                <div p-4>
                    <div text-2xl font-bold>
                        Generating test cases
                    </div>
                    <div text-lg op-70 mt-2>
                        How many test cases do you want to generate? A minimum of 5 is recommended.
                    </div>
                    <UInput
                        v-model="testCaseAmount"
                        variant="outline"
                        type="number"
                        placeholder="5"
                        size="xl"
                        my-4
                        @keyup.enter="onGenerateTestCases"
                    />
                    <div flex justify-end gap-2 mt-6>
                        <UButton color="white" size="lg" @click="isGenerateTestCasesModalOpen = false">
                            Cancel
                        </UButton>
                        <UButton color="indigo" size="lg" @click="onGenerateTestCases">
                            Generate
                        </UButton>
                    </div>
                </div>
            </UModal>
            <template #footer>
                <div flex="~ col" gap-2>
                    <ClientOnly>
                        <template #placeholder>
                            <USkeleton w-full h-10 my-2 />
                        </template>
                        <div flex items-center gap-2>
                            <UButton
                                :icon="battlesToRun > 0 ? 'i-tabler-player-stop-filled' : 'i-tabler-sword'"
                                size="lg"
                                grow
                                :color="
                                    battlesToRun > 0 ? 'red' : 'indigo'
                                "
                                @click="runOrStopBattles"
                            >
                                {{ runBattlesText }}
                            </UButton>
                            <div w-27>
                                <UInput v-model="numberOfBattles" placeholder="# of Battles" size="lg" type="number" min="1" />
                            </div>
                        </div>
                    </ClientOnly>
                </div>
            </template>
        </UCard>
    </div>
</template>
