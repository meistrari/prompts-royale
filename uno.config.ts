import { defineConfig } from 'unocss'

export default defineConfig({
    shortcuts: [
        [/u-ring-([\d\.]+)/, ([_, v]) => `ring-${v}`],
    ],
})
