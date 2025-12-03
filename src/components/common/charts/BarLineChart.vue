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
import { useThemeStore } from '@/stores/theme.store'
import { useCurrencyStore } from '@/stores/currency.store'

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

// 获取主题颜色
const themeStore = useThemeStore()
const colors = computed(() => themeStore.currentColors)

// 获取币种符号
const currencyStore = useCurrencyStore()
const currencySymbol = computed(() => currencyStore.currencySymbol)

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

  const incomeColor = colors.value.income
  const expenseColor = colors.value.expense
  const primaryColor = colors.value.primary

  if (props.showIncome) {
    series.push({
      name: 'Income',
      type: props.type,
      data: incomeData,
      itemStyle: {
        color: incomeColor,
        borderRadius: props.type === 'bar' ? [4, 4, 0, 0] : 0
      },
      lineStyle: {
        color: incomeColor,
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
        color: expenseColor,
        borderRadius: props.type === 'bar' ? [4, 4, 0, 0] : 0
      },
      lineStyle: {
        color: expenseColor,
        width: 2
      },
      smooth: true,
      symbol: 'circle',
      symbolSize: 6
    })
  }

  const surfaceColor = colors.value.surface
  const textColor = colors.value.textStrong
  const mutedColor = colors.value.textMuted

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: surfaceColor + 'f2',
      borderColor: primaryColor + '4d',
      textStyle: {
        color: textColor
      },
      axisPointer: {
        type: props.type === 'bar' ? 'shadow' : 'line'
      },
      formatter: (params: any) => {
        const symbol = currencySymbol.value
        let result = `<div style="font-weight: 600; margin-bottom: 4px;">${params[0].axisValue}</div>`
        params.forEach((item: any) => {
          const color = item.seriesName === 'Income' ? incomeColor : expenseColor
          result += `<div style="display: flex; justify-content: space-between; gap: 16px;">
            <span style="color: ${color};">● ${item.seriesName}</span>
            <span style="font-weight: 600;">${symbol}${item.value.toLocaleString()}</span>
          </div>`
        })
        return result
      }
    },
    legend: {
      show: props.showIncome && props.showExpense,
      bottom: 0,
      textStyle: {
        color: mutedColor
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
          color: primaryColor + '33'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: mutedColor,
        fontSize: 11,
        interval: props.data.length > 15 ? 'auto' : 0,
        rotate: props.data.length > 20 ? 45 : 0
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: primaryColor + '1a'
        }
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: mutedColor,
        fontSize: 11,
        formatter: (value: number) => {
          const symbol = currencySymbol.value
          if (value >= 1000) {
            return `${symbol}${(value / 1000).toFixed(0)}k`
          }
          return `${symbol}${value}`
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
