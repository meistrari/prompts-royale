export function timeout(ms: number, promise: Promise<any>) {
    const timeoutPromise = new Promise(resolve => setTimeout(resolve, ms))
    return Promise.race([promise, timeoutPromise])
}
