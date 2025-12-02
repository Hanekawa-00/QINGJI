<script setup lang="ts">
/**
 * 柱状图/折线图组件
 * 基于 ECharts + vue-echarts
 * 跨平台通用（桌面端/移动端）
 */
import { computed, provide } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'

// 注册必要的 ECharts 组件
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// 提供深色主题
provide(THEME_KEY, 'dark')

interface ChartDataItem {
  label: string
  income?: number
  expense?: number
}

interface Props {
  data: ChartDataItem[]
  type?: 'bar' | 'line'
  showIncome?: boolean
  showExpense?: boolean
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'bar',
  showIncome: true,
  showExpense: true,
  height: '240px'
})

const option = computed(() => {
  const labels = props.data.map(d => d.label)
  const incomeData = props.data.map(d => d.income ?? 0)
  const expenseData = props.data.map(d => d.expense ?? 0)

  const series: any[] = []

  if (props.showIncome) {
    series.push({
      name: 'Income',
      type: props.type,
      data: incomeData,
      itemStyle: {
        color: '#4de6a5',
        borderRadius: props.type === 'bar' ? [4, 4, 0, 0] : 0
      },
      lineStyle: {
        color: '#4de6a5',
        width: 2
      },
      smooth: true,
      symbol: 'circle',
      symbolSize: 6
    })
  }

  if (props.showExpense) {
    series.push({
      name: 'Expense',
      type: props.type,
      data: expenseData,
      itemStyle: {
        color: '#ef5f9a',
        borderRadius: props.type === 'bar' ? [4, 4, 0, 0] : 0
      },
      lineStyle: {
        color: '#ef5f9a',
        width: 2
      },
      smooth: true,
      symbol: 'circle',
      symbolSize: 6
    })
  }

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(17, 26, 22, 0.95)',
      borderColor: 'rgba(43, 215, 118, 0.3)',
      textStyle: {
        color: '#e8f5f0'
      },
      axisPointer: {
        type: props.type === 'bar' ? 'shadow' : 'line'
      },
      formatter: (params: any) => {
        let result = `<div style="font-weight: 600; margin-bottom: 4px;">${params[0].axisValue}</div>`
        params.forEach((item: any) => {
          const color = item.seriesName === 'Income' ? '#4de6a5' : '#ef5f9a'
          result += `<div style="display: flex; justify-content: space-between; gap: 16px;">
            <span style="color: ${color};">● ${item.seriesName}</span>
            <span style="font-weight: 600;">$${item.value.toLocaleString()}</span>
          </div>`
        })
        return result
      }
    },
    legend: {
      show: props.showIncome && props.showExpense,
      bottom: 0,
      textStyle: {
        color: '#8fa89e'
      },
      itemWidth: 12,
      itemHeight: 12
    },
    grid: {
      left: 10,
      right: 10,
      top: 20,
      bottom: props.showIncome && props.showExpense ? 40 : 20,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: {
        lineStyle: {
          color: 'rgba(43, 215, 118, 0.2)'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#8fa89e',
        fontSize: 11,
        interval: props.data.length > 15 ? 'auto' : 0,
        rotate: props.data.length > 20 ? 45 : 0
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: 'rgba(43, 215, 118, 0.1)'
        }
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#8fa89e',
        fontSize: 11,
        formatter: (value: number) => {
          if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}k`
          }
          return `$${value}`
        }
      }
    },
    series
  }
})
</script>

<template>
  <VChart 
    class="chart" 
    :option="option" 
    :autoresize="true"
    :style="{ height }"
  />
</template>

<style scoped>
.chart {
  width: 100%;
}
</style>
