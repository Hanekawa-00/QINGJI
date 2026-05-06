<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { 
  Empty as VanEmpty,
  showConfirmDialog,
  showToast
} from 'vant'
import 'vant/es/empty/style'
import 'vant/es/dialog/style'
import 'vant/es/toast/style'

import YearMonthPicker from '@/components/common/YearMonthPicker.vue'
import { useUserStore } from '@/stores/user.store'
import { useCurrencyFormat, useTransactions, useChartData } from '@/hooks'
import { BarLineChart } from '@/components/common/charts'
import { TransactionItem } from '@/components/mobile'
import type { Transaction } from '@/types'
import type { ChartPeriod } from '@/hooks/useChartData'

defineOptions({ name: 'MobileDashboard' })

const { t, locale } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const { format: formatCurrency } = useCurrencyFormat()

// 月份选择器
const selectedMonthTimestamp = ref<number>(Date.now())
const currentMonthDisplay = computed(() => {
  const date = new Date(selectedMonthTimestamp.value)
  const dateLocale = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
  return date.toLocaleDateString(dateLocale, { 
    year: 'numeric', 
    month: 'long' 
  })
})

// 切换月份
const changeMonth = (delta: number) => {
  const date = new Date(selectedMonthTimestamp.value)
  date.setMonth(date.getMonth() + delta)
  selectedMonthTimestamp.value = date.getTime()
}

// 年月选择器
const showYearMonthPicker = ref(false)
const selectedYear = computed(() => new Date(selectedMonthTimestamp.value).getFullYear())
const selectedMonth = computed(() => new Date(selectedMonthTimestamp.value).getMonth() + 1)

const onYearMonthConfirm = (year: number, month: number) => {
  const date = new Date(selectedMonthTimestamp.value)
  date.setFullYear(year)
  date.setMonth(month - 1)
  selectedMonthTimestamp.value = date.getTime()
}

// 使用交易数据 Hook（按月份筛选）
const { groupedTransactions, monthlyStats } = useTransactions(selectedMonthTimestamp)

// 统计数据（使用选中月份的统计）
const stats = computed(() => ({
  balance: userStore.statistics.totalBalance,  // 总余额始终显示全部
  income: monthlyStats.value.income,
  expense: monthlyStats.value.expense
}))

// 使用图表数据 Hook（带周期和类型切换）
const { chartPeriod, chartType, periodOptions, chartData } = useChartData()

// 图表总支出
const chartTotal = computed(() => chartData.value.reduce((sum, d) => sum + d.expense, 0))

// 转换图表数据格式给 ECharts 组件
const echartsData = computed(() => 
  chartData.value.map(bar => ({
    label: bar.label,
    income: bar.income,
    expense: bar.expense
  }))
)

// 是否为当前月份（用于控制图表显示）
const isCurrentMonth = computed(() => {
  const now = new Date()
  const selected = new Date(selectedMonthTimestamp.value)
  return now.getFullYear() === selected.getFullYear() && 
         now.getMonth() === selected.getMonth()
})

// 周期选择器
const showPeriodPicker = ref(false)
const periodActions = computed(() => 
  periodOptions.value.map(opt => ({
    name: opt.label,
    value: opt.value
  }))
)
const onSelectPeriod = (action: { value: ChartPeriod }) => {
  chartPeriod.value = action.value
  showPeriodPicker.value = false
}

// 切换图表类型
const toggleChartType = () => {
  chartType.value = chartType.value === 'expense' ? 'both' : 'expense'
}

// 当前周期显示文本
const currentPeriodLabel = computed(() => {
  const opt = periodOptions.value.find(o => o.value === chartPeriod.value)
  return opt?.label || ''
})

// 删除交易
const handleDelete = async (transaction: Transaction) => {
  try {
    await showConfirmDialog({
      title: t('common.confirm'),
      message: t('entry.deleteConfirm')
    })
    await userStore.deleteTransaction(transaction.id)
    showToast(t('common.deleted'))
  } catch {
    // 用户取消
  }
}

// 编辑交易（跳转到编辑页面）
const handleEdit = (transaction: Transaction) => {
  router.push({ 
    name: 'MobileEntry', 
    query: { id: transaction.id, from: 'MobileDashboard' } 
  })
}

// 编辑和删除操作由 TransactionItem 组件处理

// 格式化日期标题
const formatDateTitle = (dateStr: string) => {
  const date = new Date(dateStr)
  const dateLocale = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US'
  return date.toLocaleDateString(dateLocale, { 
    month: 'short', 
    day: 'numeric',
    weekday: 'short'
  })
}

// 跳转到日历
const goToCalendar = () => router.push({ name: 'MobileCalendar' })
// 跳转到报表
const goToReports = () => router.push({ name: 'MobileReports' })
// 跳转到记账
const goToEntry = () => router.push({ name: 'MobileEntry', query: { from: 'MobileDashboard' } })
// 跳转到设置
const goToSettings = () => router.push({ name: 'MobileSettings' })
</script>

<template>
  <div class="mobile-dashboard">
    <!-- 顶部导航栏 -->
    <header class="dashboard-header">
      <div class="header-left">
        <button class="nav-btn" @click="goToSettings">
          <span class="material-symbols-outlined">settings</span>
        </button>
      </div>
      
      <!-- 月份选择器（居中） -->
      <div class="month-selector">
        <button class="month-nav" @click="changeMonth(-1)">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <button class="month-text" @click="showYearMonthPicker = true">
          <span>{{ currentMonthDisplay }}</span>
          <span class="material-symbols-outlined arrow-icon">keyboard_arrow_down</span>
        </button>
        <button class="month-nav" @click="changeMonth(1)">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
      
      <div class="header-right">
        <button class="nav-btn" @click="goToReports">
          <span class="material-symbols-outlined">bar_chart</span>
        </button>
        <button class="nav-btn" @click="goToCalendar">
          <span class="material-symbols-outlined">calendar_today</span>
        </button>
      </div>
    </header>

    <!-- 统计卡片网格 -->
    <div class="stats-grid">
      <div class="stats-card balance">
        <p class="stats-label">{{ t('dashboard.currentBalance') }}</p>
        <p class="stats-value">{{ formatCurrency(stats.balance) }}</p>
      </div>
      <div class="stats-card income">
        <p class="stats-label">{{ t('dashboard.monthlyIncome') }}</p>
        <p class="stats-value income-text">{{ formatCurrency(stats.income) }}</p>
      </div>
      <div class="stats-card expense">
        <p class="stats-label">{{ t('dashboard.monthlySpending') }}</p>
        <p class="stats-value expense-text">{{ formatCurrency(stats.expense) }}</p>
      </div>
    </div>

    <!-- 活动图表（仅当前月份显示） -->
    <div v-if="isCurrentMonth" class="chart-card">
      <div class="chart-header">
        <p class="chart-title">{{ t('dashboard.weeklyActivity') }}</p>
        <span class="chart-badge">{{ formatCurrency(chartTotal) }}</span>
      </div>
      
      <!-- 图表过滤器 -->
      <div class="chart-filters">
        <button class="filter-btn" @click="showPeriodPicker = true">
          {{ currentPeriodLabel }}
          <span class="material-symbols-outlined">expand_more</span>
        </button>
        <button 
          class="filter-btn" 
          :class="{ active: chartType === 'both' }"
          @click="toggleChartType"
        >
          {{ chartType === 'both' ? t('common.all') : t('reports.expense') }}
        </button>
      </div>
      
      <!-- ECharts 柱状图 -->
      <BarLineChart
        :data="echartsData"
        type="bar"
        :show-income="chartType === 'both'"
        :show-expense="true"
        height="160px"
      />
    </div>

    <!-- 本月交易记录 -->
    <h3 class="section-title">{{ t('dashboard.monthlyTransactions') }}</h3>

    <template v-if="groupedTransactions.length > 0">
      <div class="transaction-groups">
        <div 
          v-for="group in groupedTransactions" 
          :key="group.date" 
          class="transaction-group"
        >
          <div class="group-header">
            <span class="group-date">{{ formatDateTitle(group.date) }}</span>
            <div class="group-totals">
              <span v-if="group.dayIncome > 0" class="group-income">+{{ formatCurrency(group.dayIncome) }}</span>
              <span v-if="group.dayExpense > 0" class="group-expense">−{{ formatCurrency(group.dayExpense) }}</span>
            </div>
          </div>
          
          <TransactionItem
            v-for="tx in group.transactions"
            :key="tx.id"
            :transaction="tx"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </div>
      </div>
    </template>

    <!-- 空状态 -->
    <van-empty 
      v-else 
      :description="t('dashboard.noTransactions')"
      image="search"
    />

    <!-- 底部间距 -->
    <div class="bottom-spacer" />

    <!-- 浮动添加按钮 -->
    <button class="fab-button" @click="goToEntry">
      <span class="material-symbols-outlined">add</span>
    </button>
    
    <!-- 周期选择器 -->
    <van-action-sheet
      v-model:show="showPeriodPicker"
      :actions="periodActions"
      :cancel-text="t('common.cancel')"
      lock-scroll
      @select="onSelectPeriod"
    />
    
    <!-- 年月选择器 -->
    <YearMonthPicker
      v-model:show="showYearMonthPicker"
      :year="selectedYear"
      :month="selectedMonth"
      @confirm="onYearMonthConfirm"
    />
  </div>
</template>

<style scoped>
.mobile-dashboard {
  min-height: 100%;
  background: var(--color-background);
}

/* 顶部导航栏 */
.dashboard-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  gap: 4px;
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-background);
}

.nav-btn {
  width: var(--touch-target-min);
  height: var(--touch-target-min);
  min-width: var(--touch-target-min);
  border-radius: 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.nav-btn .material-symbols-outlined {
  font-size: 20px;
}

.nav-btn:active {
  opacity: 0.7;
}

.page-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-strong);
  text-align: center;
  margin: 0;
}

.header-left,
.header-right {
  display: flex;
  flex-direction: row;
  gap: 4px;
  flex-shrink: 0;
}

.header-left {
  justify-content: flex-start;
}

.header-right {
  justify-content: flex-end;
}

/* 月份选择器 */
.month-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  flex: 1;
  min-width: 0;
}

.month-nav {
  width: var(--touch-target-min);
  height: var(--touch-target-min);
  min-width: var(--touch-target-min);
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.month-nav .material-symbols-outlined {
  font-size: 20px;
}

.month-nav:active {
  opacity: 0.6;
}

.month-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-strong);
  min-width: 0;
  max-width: 128px;
  text-align: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0 6px;
  min-height: var(--touch-target-min);
  border-radius: 8px;
}

.month-text span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.month-text:active {
  background: var(--color-surface-hover);
}

.month-text .arrow-icon {
  font-size: 18px;
  color: var(--color-text-muted);
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
}

.stats-card {
  padding: 16px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.stats-card.expense {
  grid-column: span 2;
}

.stats-label {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.stats-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-strong);
  letter-spacing: -0.5px;
}

.stats-value.income-text {
  color: var(--color-income);
}

.stats-value.expense-text {
  color: var(--color-expense);
}

/* 图表卡片 */
.chart-card {
  margin: 0 16px 16px;
  padding: 16px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.chart-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
}

.chart-badge {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-expense);
  background: var(--color-expense-alpha-10);
  padding: 4px 12px;
  border-radius: 999px;
}

.chart-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: var(--touch-target-min);
  padding: 0 12px;
  border-radius: 8px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 13px;
  cursor: pointer;
}

.filter-btn .material-symbols-outlined {
  font-size: 16px;
}

.filter-btn.active {
  background: var(--color-primary-alpha-10);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* 区块标题 */
.section-title {
  padding: 12px 16px 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-strong);
}

/* 交易分组列表 */
.transaction-groups {
  padding: 0 16px;
}

.transaction-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.group-date {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.group-totals {
  display: flex;
  gap: 12px;
  font-size: 13px;
  font-weight: 600;
}

.group-income {
  color: var(--color-income);
}

.group-expense {
  color: var(--color-expense);
}

/* 底部间距 */
.bottom-spacer {
  height: calc(80px + var(--safe-area-inset-bottom, 0px));
}

/* 浮动添加按钮 */
.fab-button {
  position: fixed;
  bottom: calc(24px + var(--safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  transition: transform 0.2s;
}

.fab-button:active {
  transform: translateX(-50%) scale(0.95);
}

.fab-button .material-symbols-outlined {
  font-size: 28px;
  font-weight: 600;
  color: var(--color-background);
}

/* 空状态 */
:deep(.van-empty) {
  padding: 60px 0;
}

:deep(.van-empty__description) {
  color: var(--color-text-muted);
}
</style>
