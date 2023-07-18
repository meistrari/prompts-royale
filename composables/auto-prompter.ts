import pLimit from 'p-limit'
import randomNormal from 'random-normal'
import { resguard } from 'resguard'
import { timeout } from '@/utils/timeout'
import type { Battle, Candidate, RatingIteration, TestCase } from '@/utils/types'
import { useSyncedState } from '@/utils/synced-state'
import { matrix } from 'echarts'

export function useAutoPrompter() {
    const log = createLogger('AutoPrompter')
    const candidates = useSyncedState<Candidate[]>('candidates', [])
    const description = useSyncedState<string>('description', '')
    const promptAmount = useSyncedState<number>('promptAmount', 10)
    const testCases = useSyncedState<TestCase[]>('v2.testCases', [])
    const battles = useSyncedState<Battle[]>('battles', [])
    const ratingHistory = useSyncedState<RatingIteration[]>('ratingHistory', [])
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
                prompt: trim`
                    Here are some test cases scenarios and their expected outputs:
                    """
                    ${testCases.value.map((testCase, i) => trim`
                        Test case #${String(i + 1)}:
                        Scenario: ${testCase.prompt}
                        Expected output: ${testCase.expectedOutput}
                    `).join('\n')}
                    """
                    
                    Here is what the user want the final prompt  to accomplish:
                    """
                    ${description.value.trim()}
                    """
                    
                    Respond with your prompt, and nothing else. Be creative.
                    NEVER CHEAT BY INCLUDING SPECIFICS ABOUT THE TEST CASES IN YOUR PROMPT. 
                    ANY PROMPTS WITH THOSE SPECIFIC EXAMPLES WILL BE DISQUALIFIED.
                    IF YOU USE EXAMPLES, ALWAYS USE ONES THAT ARE VERY DIFFERENT FROM THE TEST CASES.
                `,
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

        const newTestCases = response.choices!.map(choice => ({
            prompt: choice.message!.content!,
            expectedOutput: '',
            id: randomId(),
        }))

        testCases.value = [...testCases.value, ...newTestCases]
        isGeneratingTestCases.value = false
    }

    async function getScore(testCase: TestCase, posA: string, posB: string) {
        log('Getting score for', testCase.id)
        if (!testCase.expectedOutput.trim()) {
            const ai = useAI()
            const { rankingPrompt } = useSettings()
            const result = await ai.cursive.query({
                systemMessage: rankingPrompt.value,
                prompt: trim`
                    Task: ${description.value.trim()}
                    Prompt: ${testCase.prompt}
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
        else {
            const [a, b, expected] = await Promise.all([
                getEmbedding(posA),
                getEmbedding(posB),
                getEmbedding(testCase.expectedOutput),
            ])

            const scoreA = cosineSimilarity(a, expected)
            const scoreB = cosineSimilarity(b, expected)

            // Draw if both scores are below 0.7
            if (scoreA < 0.7 && scoreB < 0.7)
                return 0.5
            else
                return scoreA > scoreB ? 1 : 0
        }
    }

    async function getGeneration(prompt: string, testCase: TestCase, options?: { temperature?: number; model?: string }) {
        const ai = useAI()
        const { completionGenerationModel, completionGenerationTemperature } = useSettings()
        const result = await ai.cursive.query({
            model: completionGenerationModel.value,
            systemMessage: prompt,
            prompt: testCase.prompt,
            temperature: completionGenerationTemperature.value,
            abortSignal: stopBattleController.value?.signal,
            ...options,
        })

        if (result.choices)
            return result.choices![0].message!.content!

        return ''
    }

    async function getEmbedding(content: string) {
        const ai = useAI()
        const result = await ai.cursive.embed(content)
        return result
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

    function monteCarloSampler(activeCandidates: Candidate[]){
        const { sampleAmount } = useSettings()

        // Initialize distribution
        const distribution = activeCandidates.reduce((acc, candidate) => {
            acc[String(candidate.id)] = 0
            return acc
        }, {} as Record<string, number>)

        // Monte Carlo simulation
        const start = Date.now()
        for (let i = 0; i < sampleAmount.value; i++) {
            // TODO: Improve typing
            const samples: Record<string, number> = {}

            for (const key in distribution) {
                const candidate = activeCandidates.find(candidate => candidate.id === Number(key))!
                samples[key] = randomNormal({ mean: candidate.rating, dev: candidate.sd })
            }

            const winnerValue = Math.max(...Object.values(samples) as any[])
            const winner = Object.keys(samples).find((key: string) => samples[key] === winnerValue)!
            distribution[winner]++
        }
        log('Monte Carlo simulation took', Date.now() - start, 'ms')

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

        const adversaryA = activeCandidates.find(candidate => candidate.id === Number(a))
        const adversaryB = activeCandidates.find(candidate => candidate.id === Number(b))

        return [adversaryA, adversaryB]
    }

    async function  runBattle(adversaries: [Candidate, Candidate]) {
        const { learningRate } = useSettings()

        const newBattle: Battle = {
            a: adversaries[0].id,
            b: adversaries[1].id,
            rounds: testCases.value.map(testCase => ({ testCase, result: null, generation: { a: '', b: '' } })),
            winner: null,
        }

        const roundLimit = pLimit(5)
        const settleRounds = newBattle.rounds.map((round, roundIndex) => roundLimit(async () => {
            async function executeRound() {
                const testCase = round.testCase
                let score: 1 | 0 | 0.5 = 0.5
                const aIndex = candidates.value.findIndex(candidate => candidate.id === newBattle.a)!
                const bIndex = candidates.value.findIndex(candidate => candidate.id === newBattle.b)!
                const [posA, posB] = await Promise.all([
                    getGeneration(adversaries[0].content, testCase),
                    getGeneration(adversaries[1].content, testCase),
                ])
            

                if (!posA || !posB)
                    throw new Error('No generation')

                score = await getScore(testCase, posA, posB)

                if (score === 0.5) {
                    newBattle.rounds[roundIndex].result = 'draw'
                    newBattle.rounds[roundIndex].settledAt = new Date()
                    newBattle.rounds[roundIndex].generation = { a: posA, b: posB }
                    return newBattle.rounds[roundIndex]
                }

                const [newRatingA, newRatingB] = updateElo(
                    adversaries[0].rating,
                    adversaries[1].rating,
                    score,
                )

                adversaries[0].rating = newRatingA
                adversaries[1].rating = newRatingB

                adversaries[0].sd = Math.max(adversaries[0].sd * learningRate.value, 125)
                adversaries[1].sd = Math.max(adversaries[1].sd * learningRate.value, 125)

                newBattle.rounds[roundIndex].result = score === 1 ? 'a' : score === 0 ? 'b' : 'draw'
                newBattle.rounds[roundIndex].settledAt = new Date()
                newBattle.rounds[roundIndex].generation = { a: posA, b: posB }

                return newBattle.rounds[roundIndex]
            }

            for (let i = 0; i < 5; i++) {
                const result = await timeout(12000, executeRound())
                if (result)
                    return result
            }

            throw new Error('Round timed out')
        }))

        log('Settling rounds')
        const settled = await resguard(Promise.all(settleRounds))
        if (settled.error) {
            log('Error settling rounds', settled.error)
            return
        }
        log('Rounds settled')

        const aScore = newBattle.rounds.filter(round => round.result === 'a').length
        const bScore = newBattle.rounds.filter(round => round.result === 'b').length
        const winner = aScore > bScore ? 'a' : aScore < bScore ? 'b' : 'draw'

        newBattle.winner = winner
        battles.value.push(newBattle)
    }

    // define ammount of battles and prompts in each round
    function defineBattlesPerRound (numberOfPrompts: number, numberOfBattles: number) {
        const promptsPerRound: number[] = []
        const battlesPerRound: number[] = []
        let sumOfPromptsPerRound = 0
        let sumOfBattlesPerRound = 0

        // calculate number of prompts that will be alive in each round
        promptsPerRound[0] = numberOfPrompts
        for (let i = 1; i < Math.floor(Math.log2(numberOfPrompts)); i++) {
            promptsPerRound[i] = promptsPerRound[i-1] - Math.ceil(promptsPerRound[i-1]/2)
        }

        //calculate ammount of prompts-round for wheighing battle distribution
        for (const p of promptsPerRound){
            sumOfPromptsPerRound += p
        }
        
        for (let i = 0; i < promptsPerRound.length; i++) {
        battlesPerRound [i] = Math.floor(promptsPerRound[i]/sumOfPromptsPerRound*numberOfBattles)
        }

        for (const b of battlesPerRound){
            sumOfBattlesPerRound += b
        }

        let remainder = numberOfBattles - sumOfBattlesPerRound

        for (let i = 0; i < remainder; i++){
            battlesPerRound[i] += 1
        }

        return battlesPerRound
    }

    async function generateCandidateVariations (candidate : Candidate){
        const ai = useAI()
        const {
            candidateGenerationModel,
            candidateGenerationTemperature,
        } = useSettings()
        const newPrompt = `You are provided with :

        an original prompt,
        Inputs 1 through N (I1, I2 ... In),
        Outputs 1 through n( O1, O2 ... On) of the original prompt and
        Expected Outputs 1 through n (EO1, EO2 ... EOn)
        Your objective is to create a Final Prompt, which is a modified version of the Original prompt, that given inputs (Is) will produce Outputs as similar as possible to the shown Expected Outputs (EOs). This means that you are supposed to understand the patterns that are expected as outputs in the given "EOs" for a given "I" such as the following and make a prompt that will output an "O" as similar as possible to the corresponding "EO" in the categories that are relevant.
        
        Syntax: Syntax refers to the rules that govern the structure of sentences. AI can use algorithms to analyze the syntactical structure of sentences to understand the relationships between different words and phrases. This can help identify the subject, object, and action in a sentence, as well as other structural elements.
        Semantics: Semantics is the meaning of words and sentences. AI can analyze a text to understand the meanings of individual words in context. This involves aspects like word sense disambiguation (determining the correct meaning of a word based on context), named entity recognition (identifying people, places, and organizations), and semantic role labeling (identifying what roles different parts of a sentence play in the overall meaning).
        Sentiment Analysis: This involves determining the sentiment expressed in a text. AI can analyze a text to identify positive, negative, or neutral sentiments, as well as more specific emotions like happiness, sadness, anger, etc.
        Topic Modeling: This involves determining the main themes or topics in a text. AI can use techniques like Latent Dirichlet Allocation (LDA) to identify common topics across a collection of documents.
        Co-reference Resolution: This is the task of finding all expressions that refer to the same entity in a text. For example, in the text "John said he would come", "John" and "he" refer to the same entity.
        Textual Entailment: This involves determining if a statement logically follows from another statement. For example, given the statement "All dogs are animals", the statement "A dog is an animal" is entailed.
        Discourse Analysis: This involves understanding how different parts of a text relate to each other to form a cohesive whole. This can include understanding the narrative structure of a text, identifying discourse markers, and analyzing how different sentences or paragraphs connect.
        Pragmatics: This involves understanding how context affects the interpretation of a text. This can involve aspects like understanding sarcasm or indirect speech acts.
        Stylometry: This involves analyzing the style of a text, including aspects like word choice, sentence length, punctuation use, etc. This can be used for tasks like authorship attribution.
        Text size: Size of the expected output`

        let promptText = ``
        let lastBattle : Battle 
        let found: boolean = false
        let player : "a" | "b"

        for (let i = battles.value.length - 1; i < 0 || found; i--){
            if (battles.value[i].a === candidate.id){
                player = "a"
                lastBattle = battles.value[i]
                found = true
            }
            if (battles.value[i].b === candidate.id){
                player = "b"
                lastBattle = battles.value[i]
                found = true
            }
        }

        for (let i = 0; i <testCases.value.length; i++ ){
            promptText = promptText + `
                I${i}: ${testCases.value[i].prompt}
            
                EO${i}: ${testCases.value[i].expectedOutput}
                
                O${i}:  ${Boolean(found) === true ? lastBattle!.rounds[i].generation[player!] : await getGeneration(candidate.content, testCases.value[i])}
            `
        }

        const response = await ai.cursive.query({
            model: candidateGenerationModel.value,
            systemMessage: newPrompt,
            prompt: trim`
            Original prompt: "${candidate.content}"

            ${promptText}
            
            Output only the Final Prompt with no "" or any other text
            `,
            temperature: candidateGenerationTemperature.value,
        })

        return response.choices![0].message!.content!;
    }

   async function improveWinningCandidates (candidates: Candidate[]){
        const improvedCandidates : Candidate[] = []
        const numberOfAditionalCandidates : number = 2

        for (let i = 0; i < candidates.length; i++){

            const variants = await Promise.all(
                Array.from({length:numberOfAditionalCandidates}).map(async (_, index) => ({
                    id: candidates[i].id + 1 + index, 
                    sd: candidates[i].sd, 
                    rating: candidates[i].rating, 
                    content: await generateCandidateVariations (candidates[i])
            }))) as Candidate[]

            variants.push(candidates[i])
            const battleCombinations : [Candidate, Candidate][] = []

            for (let i = 0; i < variants.length; i++) {
                for (let j = i + 1; j < variants.length; j++) {
                    battleCombinations.push([variants[i], variants[j]]);
                }
            }
            
            for (const combination of battleCombinations){
                await runBattle(combination)
            }

            const maxRating = Math.max(...variants.map(variant => variant.rating))
            improvedCandidates[i] = variants.find(candidate => candidate.rating === maxRating)!
            improvedCandidates[i].id = candidates[i].id
        }

        return improvedCandidates
    }

    async function runNumberOfBattles(amount: number) {
        const { simultaneousBattles, promptImprovementEnabled } = useSettings()
        const battlesPerRound = promptImprovementEnabled.value ? defineBattlesPerRound (candidates.value.length, amount):[amount]
        let remainingCandidates: Candidate[] = [...candidates.value]
        battlesToRun.value = amount
        takeSnapshotOfRatings()
        for (let numberOfBattles of battlesPerRound){
            let i = 0
            while (i < numberOfBattles) {
                const amountOfBattles = Math.min(Number(simultaneousBattles.value), battlesToRun.value)
                amountOfBattles == 1 ? log(`Running Battle ${i+1}`) :log(`Running from Battle ${i + 1} to Battle ${i + amountOfBattles}`)
                const start = Date.now()
                
                await Promise.all(Array.from({ length: amountOfBattles }).map(async () => {
                    const adversaries = monteCarloSampler(remainingCandidates)
                    await runBattle(adversaries as [Candidate, Candidate])
                    for (let i = 0; i < remainingCandidates.length; i++){
                        for (let j = 0; j < candidates.value.length; j++){
                            if (remainingCandidates[i].id === candidates.value[j].id){
                                candidates.value[j] = remainingCandidates[i]
                            }
                        }
                    }

                    takeSnapshotOfRatings()

                }))

                log('Battle took', Date.now() - start, 'ms')
                battlesToRun.value -= amountOfBattles

                if (stopBattle.value && stopBattleController.value) {
                    stopBattle.value = false
                    log('Stopping battle')
                    return
                }
                i += amountOfBattles
            }


            if (promptImprovementEnabled.value && !(numberOfBattles === battlesPerRound[battlesPerRound.length-1])){
                remainingCandidates.sort((a, b) => b.rating - a.rating)
                const losers = remainingCandidates.splice(Math.floor((remainingCandidates.length) / 2 ))
                remainingCandidates = await improveWinningCandidates(remainingCandidates)
                candidates.value = [...remainingCandidates, ...losers]

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
        log('Removing candidate', id)
        candidates.value = candidates.value.filter(candidate => candidate.id !== id)
        // Remove all battles that include the candidate
        log('Removing battles that include candidate', id)
        battles.value = battles.value.filter(battle => battle.a !== id && battle.b !== id)
        // Remove candidate from all the ratings history
        log('Removing candidate from ratings history', id)
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
        getGeneration,
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

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0) // dot product
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0)) // magnitude of A
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0)) // magnitude of B

    if (magnitudeA && magnitudeB)
        return dotProduct / (magnitudeA * magnitudeB)
    else
        return 0
}
