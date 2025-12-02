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

const option = computed(() => {
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(17, 26, 22, 0.95)',
      borderColor: 'rgba(43, 215, 118, 0.3)',
      textStyle: {
        color: '#e8f5f0'
      },
      formatter: (params: any) => {
        return `<div style="font-weight: 600;">${params.name}</div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 4px;">
            <span style="color: ${params.color};">●</span>
            <span>$${params.value.toLocaleString()}</span>
            <span style="color: #8fa89e;">(${params.percent}%)</span>
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
              fill: '#8fa89e',
              fontSize: 12,
              textAlign: 'center'
            },
            top: -12
          },
          {
            type: 'text',
            style: {
              text: props.centerValue,
              fill: '#e8f5f0',
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
          borderColor: '#111a16',
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
      '#2bd776',
      '#4de6a5',
      '#ef5f9a',
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
    :autoresize="true"
    :style="{ height }"
  />
</template>

<style scoped>
.chart {
  width: 100%;
}
</style>
