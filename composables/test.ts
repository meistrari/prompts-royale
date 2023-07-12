import * as randomNormal from 'random-normal'

const candidates: any = Array.from({ length: 10 }).fill(0).map((_, i) => ({
    id: i,
    rating: 1000,
    sd: 400,
}))

// candidates

const distribution = candidates.reduce((acc, candidate) => {
    acc[candidate.id] = 0
    return acc
}, {})

// count

for (const _ in Array.from({ length: 1000 })) {
    const samples: any = {}
    for (const key in distribution)
        samples[key] = randomNormal({ mean: candidates[key].rating, dev: candidates[key].sd })
    const winnerValue = Math.max(...Object.values(samples) as any[])
    const winner = Object.keys(samples).find(key => samples[key] === winnerValue)!
    distribution[winner]++
}

// Randomly select two candidates
function randomlySelectFromDistribution(excluded = '') {
    const randomNumber = Math.ceil(Math.random() * 1000)
    let acc = 0
    const { [excluded]: _, ...distributionWithoutExcluded } = distribution
    for (const key in distributionWithoutExcluded) {
        acc += distribution[key]
        if (acc >= randomNumber)
            return key
    }
}

const a = randomlySelectFromDistribution()
const b = randomlySelectFromDistribution(a)
