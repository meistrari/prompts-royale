export function createLogger(name: string) {
    return (...args: any[]) => {
        // eslint-disable-next-line no-console
        console.log(`${name}]`, ...args)
    }
}
