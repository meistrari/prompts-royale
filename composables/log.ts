import k from 'kleur'

export function createLogger(name: string) {
    return (...args: any[]) => {
        // eslint-disable-next-line no-console
        console.log(`${k.bold().cyan(`[${name}]`)}`, ...args)
    }
}
