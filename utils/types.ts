export interface TestCase {
    prompt: string
    expectedOutput: string
    id: string
}

export interface Candidate {
    content: string
    rating: number
    sd: number
    id: number
}

export interface RatingIteration {
    iteration: number
    ratings: { rating: number; sd: number; promptId: number }[]
}

export interface Battle {
    a: number
    b: number
    rounds: {
        testCase: TestCase
        generation: {
            a: string
            b: string
        }
        result: 'a' | 'b' | 'draw' | null
        settledAt?: Date
    }[]
    winner?: 'a' | 'b' | 'draw' | null
}
