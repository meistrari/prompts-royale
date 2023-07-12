import { useDefaultPrompts } from './default-prompts'

export function useSettings() {
    const { defaultGenerateCandidatesPrompts, defaultRankingPrompt, defaultCreateTestCasePrompt } = useDefaultPrompts()
    const apiKey = useSyncedState<string>('apiKey', '')

    const simultaneousBattles = useSyncedState<number>('simultaneousBattles', 1)

    const candidateGenerationPrompts = useSyncedState<string[]>('candidateGenerationPrompts', defaultGenerateCandidatesPrompts)
    const candidateGenerationModel = useSyncedState<string>('candidateGenerationModel', 'gpt-4')
    const candidateGenerationTemperature = useSyncedState<number>('candidateGenerationTemperature', 0.9)

    const rankingPrompt = useSyncedState<string>('rankingPrompt', defaultRankingPrompt)

    const completionGenerationModel = useSyncedState<string>('completionGenerationModel', 'gpt-3.5-turbo')
    const completionGenerationTemperature = useSyncedState<number>('completionGenerationTemperature', 0.7)

    const startingRating = useSyncedState<number>('startingRating', 1000)
    const startingSD = useSyncedState<number>('startingSD', 350)
    const battleValue = useSyncedState<number>('battleValue', 100)
    const learningRate = useSyncedState<number>('learningRate', 0.96)
    const sampleAmount = useSyncedState<number>('sampleAmount', 10000)

    const rankingModel = useSyncedState<string>('rankingModel', 'gpt-4')

    const testCaseGenerationPrompt = useSyncedState<string>('testCaseGenerationPrompt', defaultCreateTestCasePrompt)

    return {
        apiKey,
        simultaneousBattles,
        candidateGenerationPrompts,
        candidateGenerationModel,
        candidateGenerationTemperature,
        rankingPrompt,
        startingRating,
        startingSD,
        battleValue,
        learningRate,
        sampleAmount,
        completionGenerationModel,
        completionGenerationTemperature,
        rankingModel,
        testCaseGenerationPrompt,
    }
}
