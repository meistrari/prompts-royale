<script lang="ts" setup>
const {
    apiKey,
    simultaneousBattles,
    candidateGenerationPrompts,
    candidateGenerationModel,
    candidateGenerationTemperature,
    battleValue,
    startingSD,
    learningRate,
    sampleAmount,
    completionGenerationModel,
    completionGenerationTemperature,
    rankingModel,
    rankingPrompt,
} = useSettings()

const isGenerateCandidatesPromptModalOpen = ref(false)
</script>

<template>
    <div max-w-540px mb-30>
        <UFormGroup
            label="OpenAI API Key"
            description="You can find your API key in your OpenAI dashboard."
            text-4.5
        >
            <ClientOnly>
                <UInput
                    v-model="apiKey"
                    placeholder="Your API key"
                    type="password"
                />
                <template #placeholder>
                    <USkeleton w-full h-10 my-2 />
                </template>
            </ClientOnly>
        </UFormGroup>

        <UFormGroup
            label="Candidate prompt generation prompts"
            description="The prompts used to automatically generate new prompt candidates."
            text-4.5 mt-3
        >
            <UButton icon="i-tabler-pencil text-6" size="xl" @click="isGenerateCandidatesPromptModalOpen = true">
                Edit prompts
            </UButton>
        </UFormGroup>
        <USlideover v-model="isGenerateCandidatesPromptModalOpen">
            <div p-4>
                <div text-xl font-bold>
                    Edit candidate generation prompts
                </div>
                <div op-70 mt-2>
                    The prompts used to automatically generate new prompt candidates.<br>
                    They're used in a round-robin fashion, so the first prompt is used for the first candidate, the second prompt is used for the second candidate, and so on.<br>
                    This is used to guarantee more variety in the candidates.
                </div>
                <UButton icon="i-tabler-plus" mt-4 @click="candidateGenerationPrompts.push('')">
                    Create new prompt
                </UButton>
                <div h-70dvh overflow-y-auto mt-4 p-2>
                    <div
                        v-for="(prompt, index) in candidateGenerationPrompts"
                        :key="index"
                        u-ring-2 p-2 rounded ring-gray-1
                        mb-4 last:mb-0 box-border
                    >
                        <div flex="~ col" gap-2>
                            <div flex items-center gap-2>
                                <div font-bold>
                                    Prompt #{{ index + 1 }}
                                </div>
                                <UButton
                                    square color="black" icon="i-tabler-trash"
                                    ms-auto @click="candidateGenerationPrompts.splice(index, 1)"
                                />
                            </div>
                            <div>
                                <UTextarea v-model="candidateGenerationPrompts[index]" autoresize />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </USlideover>

        <UFormGroup
            label="Candidate prompt generation model"
            description="The model used for automatic generation of prompt candidates. The better the model, the better the prompt candidates. We strongly recommend using GPT-4."
            text-4.5 mt-3
        >
            <ClientOnly>
                <USelect
                    v-model="candidateGenerationModel"
                    :options="['gpt-4', 'gpt-3.5-turbo']"
                />
                <template #placeholder>
                    <USkeleton w-full h-10 my-2 />
                </template>
            </ClientOnly>
        </UFormGroup>
        <UFormGroup
            label="Candidate prompt generation temperature"
            description="The temperature used for automatic generation of prompt candidates. The higher the temperature, the more creative the prompt candidates. We recommend using a temperature of 0.9."
            text-4.5 mt-3
        >
            <ClientOnly>
                <div mt-2 flex items-center gap-3>
                    <URange
                        v-model="candidateGenerationTemperature" color="primary"
                        :min="0" :max="2" :step="0.1"
                    />
                    <UBadge size="lg">
                        {{ candidateGenerationTemperature }}
                    </UBadge>
                </div>
                <template #placeholder>
                    <USkeleton w-full h-10 my-2 />
                </template>
            </ClientOnly>
        </UFormGroup>
        <UFormGroup
            label="Completion prompt generation model"
            description="The model used for test case completions. This is should be as close as possible to the model you'll use in production to complete your the final prompt."
            text-4.5 mt-3
        >
            <ClientOnly>
                <USelect
                    v-model="completionGenerationModel"
                    :options="['gpt-4', 'gpt-3.5-turbo']"
                />
                <template #placeholder>
                    <USkeleton w-full h-10 my-2 />
                </template>
            </ClientOnly>
        </UFormGroup>
        <UFormGroup
            label="Completion prompt generation temperature"
            description="The temperature used for test case completions. The higher the temperature, the more creative the test case completions. We recommend using a temperature of 0.7, the default for OpenAI's API."
            text-4.5 mt-3
        >
            <ClientOnly>
                <div mt-2 flex items-center gap-3>
                    <URange
                        v-model="completionGenerationTemperature" color="primary"
                        :min="0" :max="2" :step="0.1"
                    />
                    <UBadge size="lg">
                        {{ completionGenerationTemperature }}
                    </UBadge>
                </div>
                <template #placeholder>
                    <USkeleton w-full h-10 my-2 />
                </template>
            </ClientOnly>
        </UFormGroup>
        <UFormGroup
            label="Ranking prompt"
            description="The prompt used for ranking the candidates."
            text-4.5 mt-3
        >
            <ClientOnly>
                <UTextarea v-model="rankingPrompt" autoresize />
                <template #placeholder>
                    <USkeleton w-full h-10 my-2 />
                </template>
            </ClientOnly>
        </UFormGroup>
        <UFormGroup
            label="Ranking model"
            description="The model used for ranking the candidates. The better the model, the better the ranking. We strongly recommend using GPT-4."
            text-4.5 mt-3
        >
            <ClientOnly>
                <USelect
                    v-model="rankingModel"
                    :options="['gpt-4', 'gpt-3.5-turbo']"
                />
                <template #placeholder>
                    <USkeleton w-full h-10 my-2 />
                </template>
            </ClientOnly>
        </UFormGroup>
        <UFormGroup
            label="Simultaneous Battles"
            description="The amount of simultaneous battles to run. It's recommended to keep this number low to avoid rate limiting. The lower the number, the slower the battles will run, but with better matchmaking accuracy."
            text-4.5 mt-3
        >
            <ClientOnly>
                <div mt-2 flex items-center gap-3>
                    <URange
                        v-model="simultaneousBattles" color="primary"
                        :min="1" :max="6"
                    />
                    <UBadge size="lg">
                        {{ simultaneousBattles }}
                    </UBadge>
                </div>
                <template #placeholder>
                    <USkeleton w-full h-10 my-2 />
                </template>
            </ClientOnly>
        </UFormGroup>
        <UFormGroup
            label="Battle value"
            description="The value of a battle. This is the amount of rating points the winner gets if it wins all the rounds."
            text-4.5 mt-3
        >
            <ClientOnly>
                <div mt-2 flex items-center gap-3>
                    <URange
                        v-model="battleValue" color="primary"
                        :min="30" :max="200" :step="1"
                    />
                    <UBadge size="lg">
                        {{ battleValue }}
                    </UBadge>
                </div>
                <template #placeholder>
                    <USkeleton w-full h-10 my-2 />
                </template>
            </ClientOnly>
        </UFormGroup>
        <UFormGroup
            label="Starting standard deviation"
            description="The higher the number, the longer it takes for a winner to emerge with certainty. It affects the matchmaking by increasing the probability for comeback in correlation to the size of the standard deviation."
        >
            <ClientOnly>
                <div mt-2 flex items-center gap-3>
                    <URange
                        v-model="startingSD" color="primary"
                        :min="100" :max="600" :step="1"
                    />
                    <UBadge size="lg">
                        {{ startingSD }}
                    </UBadge>
                </div>
                <template #placeholder>
                    <USkeleton w-full h-10 my-2 />
                </template>
            </ClientOnly>
        </UFormGroup>
        <UFormGroup
            label="Learning rate"
            description="The rate at which standard deviation of the candidates decrease after each battle, increasing the certainty of the rating of the candidate."
        >
            <ClientOnly>
                <div mt-2 flex items-center gap-3>
                    <URange
                        v-model="learningRate" color="primary"
                        :min="0.9" :max="1" :step="0.01"
                    />
                    <UBadge size="lg">
                        {{ learningRate.toFixed(2) }}
                    </UBadge>
                </div>
                <template #placeholder>
                    <USkeleton w-full h-10 my-2 />
                </template>
            </ClientOnly>
        </UFormGroup>
        <UFormGroup
            label="Sample amount"
            description="The amount of samples during monte carlo simulation. The higher the number, the more accurate the matchmaking will be, but the slower it will run."
        >
            <ClientOnly>
                <div mt-2 flex items-center gap-3>
                    <UInput
                        v-model="sampleAmount"
                    />
                </div>
                <template #placeholder>
                    <USkeleton w-full h-10 my-2 />
                </template>
            </ClientOnly>
        </UFormGroup>
    </div>
</template>
