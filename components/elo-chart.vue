<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
    GridComponent,
    LegendComponent,
    TitleComponent,
    TooltipComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
    CanvasRenderer,
    LineChart,
    GridComponent,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
])

const { ratingHistory, candidates, takeSnapshotOfRatings, battles } = useAutoPrompter()

watchEffect(() => {
    if (candidates.value.length > 0 && ratingHistory.value.length === 0)
        takeSnapshotOfRatings()
})

const option = computed(() => {
    const maxRating = Math.max(...ratingHistory.value.map(i => Math.max(...i.ratings.map(r => r.rating))))
    const maxRatingRounded = Math.ceil(maxRating / 100) * 100
    const minRating = Math.min(...ratingHistory.value.map(i => Math.min(...i.ratings.map(r => r.rating))))
    const minRatingRounded = Math.floor(minRating / 100) * 100
    return {
        xAxis: {
            // X axis is the iteration number
            type: 'category',
            data: ratingHistory.value.map((_, i) => i + 1),
        },
        yAxis: {
            type: 'value',
            min: maxRatingRounded + 50,
            max: minRatingRounded - 50,
        },
        tooltip: {
            order: 'valueDesc',
            trigger: 'axis',
        },
        grid: {
            left: 50,
            right: 0,
            bottom: 40,
            top: 0,
        },
        series: candidates.value.map(candidate => ({
            name: `Prompt #${candidate.id + 1}`,
            type: 'line',
            data: ratingHistory.value.map((iteration) => {
                const data = iteration.ratings.find(r => r.promptId === candidate.id)
                if (data)
                    return Math.round(data.rating)
                return false
            }).filter(Boolean),
            showSymbol: false,
            emphasis: {
                focus: 'series',
            },
        })),
    }
})

onMounted(() => {

})
</script>

<template>
    <UCard
        v-if="battles.length"
        :ui="{
            body: {
                padding: 'p-0',
            },
            base: 'overflow-visible',
        }"
        z-index-555 h-40dvh
    >
        <template #header>
            <div font-bold text-5>
                Ratings over iterations
            </div>
        </template>
        <ClientOnly>
            <VChart class="chart" :option="option" autoresize />
        </ClientOnly>
    </UCard>
</template>

<style scoped>
.chart {
    width: 100%;
    height: 33dvh;
    z-index: 555;
}
</style>
