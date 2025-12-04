<script setup lang="ts">
/**
 * 月份年份选择器组件
 * 桌面端专用 (NaiveUI)
 * 解决 NDatePicker type="month" 的 UX 问题
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSelect, NSpace } from 'naive-ui'

const { t } = useI18n()

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
const monthOptions = computed(() => [
  { label: t('months.jan'), value: 0 },
  { label: t('months.feb'), value: 1 },
  { label: t('months.mar'), value: 2 },
  { label: t('months.apr'), value: 3 },
  { label: t('months.may'), value: 4 },
  { label: t('months.jun'), value: 5 },
  { label: t('months.jul'), value: 6 },
  { label: t('months.aug'), value: 7 },
  { label: t('months.sep'), value: 8 },
  { label: t('months.oct'), value: 9 },
  { label: t('months.nov'), value: 10 },
  { label: t('months.dec'), value: 11 }
])
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
