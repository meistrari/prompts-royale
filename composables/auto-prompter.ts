import pLimit from 'p-limit'
import randomNormal from 'random-normal'

export function useAutoPrompter() {
    const candidates = useSyncedState<{
        content: string
        rating: number
        sd: number
        id: number
    }[]>('candidates', [])
    const description = useSyncedState<string>('description', '')
    const promptAmount = useSyncedState<number>('promptAmount', 10)
    const testCases = useSyncedState<string[]>('testCases', [])
    const battles = useSyncedState<Battle[]>('battles', [])
    const ratingHistory = useSyncedState<{
        iteration: number
        ratings: { rating: number; sd: number; promptId: number }[]
    }[]>('ratingHistory', [])
    const apiKey = useSyncedState<string>('apiKey', '')
    const battlesToRun = useState<number>('battlesToRun', () => 0)
    const stopBattleController = useState<AbortController | null>('stopBattleSignal', () => null)
    if (process.client)
        stopBattleController.value = new AbortController()

    const stopBattle = useState<boolean>('stopBattle', () => false)

    const isGeneratingPromptCandidates = useState('isGeneratingPromptCandidates', () => false)
    async function generatePromptCandidates(amount: number) {
        const ai = useAI()
        const {
            candidateGenerationModel,
            candidateGenerationTemperature,
            startingRating,
            startingSD,
            candidateGenerationPrompts,
        } = useSettings()
        isGeneratingPromptCandidates.value = true

        const promptGenerationLimit = pLimit(5)

        // Generates prompt candidates in parallel, with temperature set to 0 on the first one
        // Than varying using different system messages in a round-robin fashion
        const promptsGenerated = Array.from({ length: amount }).map((_, i) => promptGenerationLimit(async () => {
            const currentPrompt = candidateGenerationPrompts.value[i % candidateGenerationPrompts.value.length]
            const response = await ai.cursive.query({
                model: candidateGenerationModel.value,
                systemMessage: currentPrompt,
                prompt: `Here are some test cases:\`${testCases.value.join('\n')}\`\n\nHere is the description of the use-case: \`${description.value.trim()}\`\n\nRespond with your prompt, and nothing else. Be creative.`,
                temperature: i === 0 ? 0 : candidateGenerationTemperature.value,
            })

            if (response.error) {
                useNotification().error(response.error.message, { description: response.error.details.message })
                isGeneratingPromptCandidates.value = false
                return ''
            }

            const prompt = response.choices![0].message!.content!
            return prompt
        }))

        const prompts: string[] = (await Promise.all(promptsGenerated)).filter(Boolean)

        if (prompts.length) {
            candidates.value = [
                ...candidates.value,
                ...prompts.map((content, id) => ({
                    content,
                    rating: startingRating.value,
                    sd: startingSD.value,
                    id,
                })),
            ]
        }

        isGeneratingPromptCandidates.value = false
    }

    const isGeneratingTestCases = useState('isGeneratingTestCases', () => false)
    async function generateTestCases(amount: number) {
        const ai = useAI()
        const { testCaseGenerationPrompt } = useSettings()
        isGeneratingTestCases.value = true
        const response = await ai.cursive.query({
            model: 'gpt-4',
            systemMessage: testCaseGenerationPrompt.value,
            prompt: `Task: ${description.value.trim()}`,
            temperature: 1.5,
            n: Number(amount),
        })

        if (response.error) {
            useNotification().error(response.error.message, { description: response.error.details.message })
            return
        }

        const newTestCases = response.choices!.map(choice => choice.message!.content!)
        testCases.value = [...testCases.value, ...newTestCases]
        isGeneratingTestCases.value = false
    }

    async function getScore(testCase: string, posA: string, posB: string) {
        const ai = useAI()
        const { rankingPrompt } = useSettings()
        const result = await ai.cursive.query({
            systemMessage: rankingPrompt.value,
            prompt: trim`
                Task: ${description.value.trim()}
                Prompt: ${testCase}
                Generation A: ${posA}
                Generation B: ${posB}
            `,
            logitBias: {
                32: 100,
                33: 100,
            },
            maxTokens: 1,
            temperature: 0,
            abortSignal: stopBattleController.value?.signal,
            model: 'gpt-4',
        })
        const winner = result.choices?.[0].message?.content
        return winner === 'A' ? 1 : winner === 'B' ? 0 : 0.5
    }

    async function getGeneration(prompt: string, testCase: string) {
        const ai = useAI()
        const { completionGenerationModel, completionGenerationTemperature } = useSettings()
        const result = await ai.cursive.query({
            model: completionGenerationModel.value,
            systemMessage: prompt,
            prompt: testCase,
            temperature: completionGenerationTemperature.value,
            abortSignal: stopBattleController.value?.signal,
        })
        return result.choices![0].message!.content!
    }

    function takeSnapshotOfRatings() {
        ratingHistory.value.push({
            iteration: ratingHistory.value.length,
            ratings: candidates.value.map(candidate => ({
                rating: candidate.rating,
                sd: candidate.sd,
                promptId: candidate.id,
            })),
        })
    }

    async function runBattle() {
        const { sampleAmount, learningRate } = useSettings()

        // Initialize distribution
        const distribution = candidates.value.reduce((acc, candidate) => {
            acc[String(candidate.id)] = 0
            return acc
        }, {} as Record<string, number>)

        // Monte Carlo simulation
        const start = Date.now()
        for (let i = 0; i < sampleAmount.value; i++) {
            // TODO: Improve typing
            const samples: Record<string, number> = {}

            for (const key in distribution) {
                const candidate = candidates.value.find(candidate => candidate.id === Number(key))!
                samples[key] = randomNormal({ mean: candidate.rating, dev: candidate.sd })
            }

            const winnerValue = Math.max(...Object.values(samples) as any[])
            const winner = Object.keys(samples).find((key: string) => samples[key] === winnerValue)!
            distribution[winner]++
        }
        console.log('Monte Carlo simulation took', Date.now() - start, 'ms')

        // Randomly select two candidates
        function randomlySelectFromDistribution(excluded = '') {
            const { [excluded]: excludedValue = 0, ...distributionWithoutExcluded } = distribution
            const randomNumber = Math.ceil(Math.random() * (sampleAmount.value - excludedValue))
            let acc = 0
            for (const key in distributionWithoutExcluded) {
                acc += distribution[key]
                if (acc >= randomNumber)
                    return key
            }
        }

        const a = randomlySelectFromDistribution()
        const b = randomlySelectFromDistribution(a)

        const newBattle: Battle = {
            a: Number(a),
            b: Number(b),
            rounds: testCases.value.map(testCase => ({ testCase, result: null, generation: { a: '', b: '' } })),
            winner: null,
        }

        const roundLimit = pLimit(5)
        const settleRounds = newBattle.rounds.map((round, roundIndex) => roundLimit(async () => {
            const testCase = round.testCase
            const aIndex = candidates.value.findIndex(candidate => candidate.id === newBattle.a)!
            const bIndex = candidates.value.findIndex(candidate => candidate.id === newBattle.b)!
            const [a, b] = [candidates.value[aIndex], candidates.value[bIndex]]
            const [posA, posB] = await Promise.all([
                getGeneration(a.content, testCase),
                getGeneration(b.content, testCase),
            ])
            const score = await getScore(testCase, posA, posB)
            const [newRatingA, newRatingB] = updateElo(
                candidates.value[aIndex].rating,
                candidates.value[bIndex].rating,
                score,
            )

            candidates.value[aIndex].rating = newRatingA
            candidates.value[bIndex].rating = newRatingB

            candidates.value[aIndex].sd = Math.max(candidates.value[aIndex].sd * learningRate.value, 125)
            candidates.value[bIndex].sd = Math.max(candidates.value[bIndex].sd * learningRate.value, 125)

            newBattle.rounds[roundIndex].result = score === 1 ? 'a' : score === 0 ? 'b' : 'draw'
            newBattle.rounds[roundIndex].settledAt = new Date()
            newBattle.rounds[roundIndex].generation = { a: posA, b: posB }

            return newBattle.rounds[roundIndex]
        }))

        await Promise.all(settleRounds)

        const aScore = newBattle.rounds.filter(round => round.result === 'a').length
        const bScore = newBattle.rounds.filter(round => round.result === 'b').length
        const winner = aScore > bScore ? 'a' : aScore < bScore ? 'b' : 'draw'

        newBattle.winner = winner
        battles.value.push(newBattle)

        takeSnapshotOfRatings()
    }

    async function runNumberOfBattles(amount: number) {
        const { simultaneousBattles } = useSettings()
        battlesToRun.value = amount
        for (let i = 0; i < amount; i++) {
            console.log(`Battle ${i}`)
            const amountOfBattles = Math.min(Number(simultaneousBattles.value), battlesToRun.value)
            const start = Date.now()
            await Promise.all(Array.from({ length: amountOfBattles }).map(() => runBattle()))
            console.log('Battle took', Date.now() - start, 'ms')
            battlesToRun.value -= amountOfBattles

            if (stopBattle.value && stopBattleController.value) {
                stopBattleController.value.abort()
                stopBattleController.value = new AbortController()
                stopBattle.value = false
                return
            }
        }
    }

    function stopRunningBattles() {
        stopBattle.value = true
        stopBattleController.value?.abort()
        stopBattleController.value = new AbortController()
        battlesToRun.value = 0
    }

    function resetCandidatesRatingAndSD() {
        const { startingRating, startingSD } = useSettings()
        candidates.value = candidates.value.map(candidate => ({
            ...candidate,
            rating: startingRating.value,
            sd: startingSD.value,
        }))
    }

    function createEmptyCandidate() {
        const { startingRating, startingSD } = useSettings()
        candidates.value.push({
            content: '',
            rating: startingRating.value,
            sd: startingSD.value,
            id: candidates.value.length,
        })
    }

    function clearCandidates() {
        candidates.value = []
        battles.value = []
        ratingHistory.value = []
    }

    function clearBattles() {
        battles.value = []
        ratingHistory.value = []
    }

    function updateElo(ratingA: number, ratingB: number, score1: number) {
        const { battleValue } = useSettings()
        const expectedScoreA = expectedScore(ratingB, ratingA)
        const expectedScoreB = expectedScore(ratingA, ratingB)

        const roundValue = battleValue.value / testCases.value.length
        const newRatingA = ratingA + roundValue * (score1 - expectedScoreA)
        const newRatingB = ratingB + roundValue * (1 - score1 - expectedScoreB)

        return [newRatingA, newRatingB] as const
    }

    function removeCandidate(id: number) {
        candidates.value = candidates.value.filter(candidate => candidate.id !== id)
        // Remove all battles that include the candidate
        battles.value = battles.value.filter(battle => battle.a !== id && battle.b !== id)
        // Remove candidate from all the ratings history
        ratingHistory.value = ratingHistory.value.map(rating => ({
            ...rating,
            ratings: rating.ratings.filter(rating => rating.promptId !== id),
        }))
    }

    return {
        candidates,
        description,
        promptAmount,
        testCases,
        battles,
        battlesToRun,
        isGeneratingPromptCandidates,
        generatePromptCandidates,
        expectedScore,
        resetCandidatesRatingAndSD,
        runBattle,
        removeCandidate,
        clearBattles,
        ratingHistory,
        takeSnapshotOfRatings,
        apiKey,
        runNumberOfBattles,
        stopRunningBattles,
        clearCandidates,
        createEmptyCandidate,
        isGeneratingTestCases,
        generateTestCases,
    }
}

function expectedScore(ratingA: number, ratingB: number) {
    return 1 / (1 + 10 ** ((ratingA - ratingB) / 400))
}

interface Battle {
    a: number
    b: number
    rounds: {
        testCase: string
        generation: {
            a: string
            b: string
        }
        result: 'a' | 'b' | 'draw' | null
        settledAt?: Date
    }[]
    winner?: 'a' | 'b' | 'draw' | null
}
