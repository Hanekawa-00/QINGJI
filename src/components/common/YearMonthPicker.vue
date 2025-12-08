<script setup lang="ts">
/**
 * 年月选择器组件
 * 通用组件（移动端 + 桌面端）
 * 居中弹窗，左侧年份列表，右侧月份网格
 */
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'YearMonthPicker' })

const { t, locale } = useI18n()

type PickerMode = 'year' | 'month' | 'year-month'

interface Props {
  /** 是否显示 */
  show: boolean
  /** 当前年份 */
  year: number
  /** 当前月份 (1-12) */
  month?: number
  /** 模式: year=只选年, month=只选月, year-month=选年月 */
  mode?: PickerMode
  /** 最小年份 */
  minYear?: number
  /** 最大年份 */
  maxYear?: number
}

const props = withDefaults(defineProps<Props>(), {
  month: 1,
  mode: 'year-month',
  minYear: 2020,
  maxYear: () => new Date().getFullYear() + 1
})

const emit = defineEmits<{
  'update:show': [value: boolean]
  'update:year': [value: number]
  'update:month': [value: number]
  'confirm': [year: number, month: number]
}>()

// 内部状态
const selectedYear = ref(props.year)
const selectedMonth = ref(props.month)
const yearListRef = ref<HTMLElement | null>(null)

// 年份列表
const years = computed(() => {
  const list: number[] = []
  for (let y = props.maxYear; y >= props.minYear; y--) {
    list.push(y)
  }
  return list
})

// 月份列表
const months = computed(() => {
  const isZh = locale.value === 'zh-CN'
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: isZh ? `${i + 1}月` : t(`months.${['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][i]}`)
  }))
})

// 监听 props 变化同步内部状态
watch(() => props.year, (val) => {
  selectedYear.value = val
})

watch(() => props.month, (val) => {
  selectedMonth.value = val
})

// 弹窗打开时滚动到当前年份
watch(() => props.show, async (visible) => {
  if (visible) {
    selectedYear.value = props.year
    selectedMonth.value = props.month
    await nextTick()
    scrollToYear(selectedYear.value)
  }
})

// 滚动到指定年份
function scrollToYear(year: number) {
  if (!yearListRef.value) return
  const yearEl = yearListRef.value.querySelector(`[data-year="${year}"]`) as HTMLElement
  if (yearEl) {
    yearEl.scrollIntoView({ block: 'center', behavior: 'instant' })
  }
}

// 选择年份
function selectYear(year: number) {
  selectedYear.value = year
  // 年份模式下，选择年份直接确认
  if (props.mode === 'year') {
    emit('update:year', selectedYear.value)
    emit('confirm', selectedYear.value, selectedMonth.value)
    close()
  }
}

// 选择月份并确认
function selectMonth(month: number) {
  selectedMonth.value = month
  emit('update:year', selectedYear.value)
  emit('update:month', selectedMonth.value)
  emit('confirm', selectedYear.value, selectedMonth.value)
  close()
}

// 关闭弹窗
function close() {
  emit('update:show', false)
}

// 点击遮罩关闭
function onOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="ym-fade">
      <div v-if="show" class="ym-picker-overlay" @click="onOverlayClick">
        <div class="ym-picker-dialog" :class="{ 'year-only': mode === 'year' }">
          <!-- 年份列表 -->
          <div ref="yearListRef" class="ym-year-list" :class="{ 'full-width': mode === 'year' }">
            <div
              v-for="y in years"
              :key="y"
              :data-year="y"
              class="ym-year-item"
              :class="{ active: y === selectedYear }"
              @click="selectYear(y)"
            >
              {{ y }}{{ locale === 'zh-CN' ? '年' : '' }}
            </div>
          </div>
          
          <!-- 月份网格（仅在 month 或 year-month 模式显示） -->
          <div v-if="mode !== 'year'" class="ym-month-grid">
            <div
              v-for="m in months"
              :key="m.value"
              class="ym-month-item"
              :class="{ 
                active: m.value === selectedMonth && selectedYear === year,
                current: m.value === month && selectedYear === year
              }"
              @click="selectMonth(m.value)"
            >
              {{ m.label }}
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ym-picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.ym-picker-dialog {
  display: flex;
  background: var(--color-surface);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 340px;
  width: 90%;
  max-height: 360px;
}

/* 年份列表 */
.ym-year-list {
  width: 90px;
  max-height: 360px;
  overflow-y: auto;
  border-right: 1px solid var(--color-border);
  background: var(--color-background);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.ym-year-list.full-width {
  width: 100%;
  border-right: none;
}

.ym-picker-dialog.year-only {
  max-width: 180px;
}

.ym-year-list::-webkit-scrollbar {
  display: none;
}

.ym-year-item {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
  white-space: nowrap;
}

.ym-year-item:hover {
  background: var(--color-surface-hover);
}

.ym-year-item.active {
  color: var(--color-primary);
  background: var(--color-primary-alpha-10);
  border-left: 3px solid var(--color-primary);
  padding-left: 13px;
}

/* 月份网格 */
.ym-month-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 16px;
  align-content: start;
}

.ym-month-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-strong);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.ym-month-item:hover {
  background: var(--color-surface-hover);
}

.ym-month-item.current {
  color: var(--color-primary);
}

.ym-month-item.active {
  background: var(--color-primary);
  color: white;
}

/* 动画 */
.ym-fade-enter-active,
.ym-fade-leave-active {
  transition: opacity 0.2s ease;
}

.ym-fade-enter-active .ym-picker-dialog,
.ym-fade-leave-active .ym-picker-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.ym-fade-enter-from,
.ym-fade-leave-to {
  opacity: 0;
}

.ym-fade-enter-from .ym-picker-dialog,
.ym-fade-leave-to .ym-picker-dialog {
  transform: scale(0.9);
  opacity: 0;
}
</style>
