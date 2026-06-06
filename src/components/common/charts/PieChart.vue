<script setup lang="ts">
/**
 * 饼图组件
 * 基于 ECharts + vue-echarts
 * 跨平台通用（桌面端/移动端）
 */
import { computed, provide } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'
import { useThemeStore } from '@/stores/theme.store'
import { useCurrencyStore } from '@/stores/currency.store'

// 注册必要的 ECharts 组件
use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
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
  name: string
  value: number
  color?: string
  icon?: string
}

interface Props {
  data: ChartDataItem[]
  title?: string
  centerLabel?: string
  centerValue?: string
  height?: string
  radius?: [string, string]
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  centerLabel: '',
  centerValue: '',
  height: '200px',
  radius: () => ['55%', '75%']
})

const updateOptions = {
  notMerge: true,
  lazyUpdate: false
}

const option = computed(() => {
  const c = colors.value
  
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: c.surface + 'f2',
      borderColor: c.primary + '4d',
      textStyle: {
        color: c.textStrong
      },
      position: function (point: number[]) {
        // 显示在鼠标右侧
        return [point[0] + 10, point[1] - 20]
      },
      formatter: (params: any) => {
        const symbol = currencySymbol.value
        return `<div style="font-weight: 600;">${params.name}</div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 4px;">
            <span style="color: ${params.color};">●</span>
            <span>${symbol}${params.value.toLocaleString()}</span>
            <span style="color: ${c.textMuted};">(${params.percent}%)</span>
          </div>`
      }
    },
    legend: {
      show: false
    },
    graphic: props.centerLabel || props.centerValue ? [
      {
        type: 'group',
        left: 'center',
        top: 'center',
        children: [
          {
            type: 'text',
            style: {
              text: props.centerLabel,
              fill: c.textMuted,
              fontSize: 12,
              textAlign: 'center'
            },
            top: -12
          },
          {
            type: 'text',
            style: {
              text: props.centerValue,
              fill: c.textStrong,
              fontSize: 16,
              fontWeight: 'bold',
              textAlign: 'center'
            },
            top: 6
          }
        ]
      }
    ] : [],
    series: [
      {
        type: 'pie',
        radius: props.radius,
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: c.surface,
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          scale: true,
          scaleSize: 8,
          label: {
            show: false
          },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: props.data.map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: item.color ? { color: item.color } : undefined
        }))
      }
    ],
    color: [
      c.primary,
      c.income,
      c.expense,
      '#f7a35c',
      '#7cb5ec',
      '#8085e9',
      '#90ed7d',
      '#e4d354'
    ]
  }
})
</script>

<template>
  <VChart 
    class="chart" 
    :option="option" 
    :update-options="updateOptions"
    :autoresize="true"
    :style="{ height }"
  />
</template>

<style scoped>
.chart {
  width: 100%;
}
</style>
