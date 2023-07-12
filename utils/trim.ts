export function trim(str: TemplateStringsArray, ...args: string[]) {
    let result = str[0]
    for (let i = 0; i < args.length; i++)
        result += args[i] + str[i + 1]

    const lines = result.split('\n')
    let minIndent = Infinity
    for (const line of lines) {
        const indent = line.search(/\S/)
        if (indent !== -1)
            minIndent = Math.min(minIndent, indent)
    }

    result = ''
    for (const line of lines)
        result += `${line.slice(minIndent)}\n`

    return result.trim()
}
