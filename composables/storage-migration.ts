import type { TestCase } from '@/utils/types'

export function runMigrations() {
    if (process.client) {
        // Test case v1 to v2
        const v1TestCases = useSyncedState<string[]>('testCases', [])
        const v2TestCases = useSyncedState<TestCase[]>('v2.testCases', [])

        if (v1TestCases.value.length) {
            v2TestCases.value = v1TestCases.value.map((testCase) => {
                return {
                    prompt: testCase,
                    expectedOutput: '',
                    id: randomId(),
                }
            })
            v1TestCases.value = []
        }
    }
}
