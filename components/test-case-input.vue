<script lang="ts" setup>
const props = defineProps<{ testCaseId: string }>()

const { testCases, getGeneration, description } = useAutoPrompter()
const index = computed(() =>
    testCases.value.findIndex(({ id }) => id === props.testCaseId),
)

function deleteTestCase() {
    testCases.value = testCases.value.filter(({ id }) => id !== props.testCaseId)
}

const isGeneratingExpectedOutput = ref(false)
async function onClickGenerateExpectedOutput() {
    isGeneratingExpectedOutput.value = true
    const generation = await getGeneration(
        trim`
            Given a prompt: ${description.value}
            When the user inputs: ${testCases.value[index.value].prompt}
            Then the program should output:

            Remember, always output only the exact expected output.
            Always output only one expected output.
        `,
        testCases.value[index.value],
        {
            model: 'gpt-4',
            temperature: 1.2,
        },
    )

    // Remove trailing and leading quotes
    testCases.value[index.value].expectedOutput = generation.replace(/^"/, '').replace(/"$/, '')
    isGeneratingExpectedOutput.value = false
}
</script>

<template>
    <div
        w-full u-ring-1 ring-gray-2 rounded
        p-2 gap-2
        bg="dark-1/2"
    >
        <div grow flex="~ col" gap-2.5>
            <div font-bold uppercase text-3.25>
                Scenario
            </div>
            <UTextarea
                v-model="testCases[index].prompt" autoresize :rows="1" size="lg" placeholder="e.g. A new fitness app called StayFit" w-full
                :ui="{
                    rounded: 'rounded-l-md',
                }"
                z-5 relative
            />
            <div flex items-center h-5>
                <UTooltip>
                    <div font-bold uppercase text-3.25 flex items-center>
                        <span>Expected Output</span>
                        <UIcon name="i-tabler-info-circle" ml-1 text-gray-5 text-4 />
                    </div>
                </UTooltip>
                <UButton
                    v-if="!testCases[index].expectedOutput.trim()"
                    color="white"
                    icon="i-tabler-sparkles text-indigo text-4.5"
                    size="xs"
                    :loading="isGeneratingExpectedOutput"
                    ms-auto
                    @click="onClickGenerateExpectedOutput"
                >
                    Generate expected output
                </UButton>
            </div>
            <UTextarea
                v-model="testCases[index].expectedOutput" autoresize :rows="1" size="lg" placeholder="e.g. A new fitness app called StayFit" w-full
                :ui="{
                    rounded: 'rounded-l-md',
                }"
                z-5 relative
            />
        </div>
        <div flex mt-2 gap-2 justify-end>
            <UButton
                icon="i-tabler-trash text-5" color="gray" square size="lg" relative
                z-0
                @click="deleteTestCase"
            />
        </div>
    </div>
</template>
