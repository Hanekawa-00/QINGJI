<script setup lang="ts">
/**
 * 月份年份选择器组件
 * 桌面端专用 (NaiveUI)
 * 解决 NDatePicker type="month" 的 UX 问题
 */
import { computed } from 'vue'
import { NSelect, NSpace } from 'naive-ui'

interface Props {
  /** 时间戳 */
  value: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:value': [value: number]
}>()

// 当前选中的年份
const selectedYear = computed({
  get: () => new Date(props.value).getFullYear(),
  set: (year: number) => {
    const date = new Date(props.value)
    date.setFullYear(year)
    emit('update:value', date.getTime())
  }
})

// 当前选中的月份 (0-11)
const selectedMonth = computed({
  get: () => new Date(props.value).getMonth(),
  set: (month: number) => {
    const date = new Date(props.value)
    date.setMonth(month)
    emit('update:value', date.getTime())
  }
})

// 年份选项 (当前年份前后5年)
const currentYear = new Date().getFullYear()
const yearOptions = computed(() => {
  const years = []
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    years.push({ label: String(y), value: y })
  }
  return years
})

// 月份选项
const monthOptions = [
  { label: 'Jan', value: 0 },
  { label: 'Feb', value: 1 },
  { label: 'Mar', value: 2 },
  { label: 'Apr', value: 3 },
  { label: 'May', value: 4 },
  { label: 'Jun', value: 5 },
  { label: 'Jul', value: 6 },
  { label: 'Aug', value: 7 },
  { label: 'Sep', value: 8 },
  { label: 'Oct', value: 9 },
  { label: 'Nov', value: 10 },
  { label: 'Dec', value: 11 }
]
</script>

<template>
  <n-space :size="4">
    <n-select
      v-model:value="selectedYear"
      :options="yearOptions"
      size="small"
      :style="{ width: '80px' }"
      :consistent-menu-width="false"
    />
    <n-select
      v-model:value="selectedMonth"
      :options="monthOptions"
      size="small"
      :style="{ width: '72px' }"
      :consistent-menu-width="false"
    />
  </n-space>
</template>
