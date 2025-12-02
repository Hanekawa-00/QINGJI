<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NCard, 
  NStatistic, 
  NButton, 
  NGrid, 
  NGi, 
  NSpace, 
  NRadioGroup,
  NRadioButton,
  NSelect
} from 'naive-ui'
import { useUserStore } from '@/stores/user.store'
import { 
  formatCurrency, 
  useChartData,
  useTransactions
} from '@/hooks'
import { GroupedTransactionList, MonthYearPicker, BarLineChart } from '@/components/desktop'

const router = useRouter()
const userStore = useUserStore()

// 统计卡片数据
const statsCards = computed(() => [
  {
    label: 'Current Balance',
    value: formatCurrency(userStore.statistics.totalBalance),
    subtitle: 'Cash + Accounts',
    color: 'primary',
    valueColor: 'var(--color-text-strong)'
  },
  {
    label: 'Monthly Income',
    value: formatCurrency(userStore.statistics.monthlyIncome),
    subtitle: 'Salary + Bonus',
    color: 'success',
    valueColor: 'var(--color-income)'
  },
  {
    label: 'Monthly Spending',
    value: formatCurrency(userStore.statistics.monthlyExpense),
    subtitle: 'Cards + Cash',
    color: 'error',
    valueColor: 'var(--color-expense)'
  }
])

// 月份选择器
const selectedMonthTimestamp = ref<number>(Date.now())

// 使用复用的图表数据 Hook
const { chartPeriod, chartType, periodOptions, chartData } = useChartData()

// 转换图表数据格式给 ECharts 组件
const echartsData = computed(() => 
  chartData.value.map(bar => ({
    label: bar.label,
    income: bar.income,
    expense: bar.expense
  }))
)

// 使用复用的交易数据 Hook
const { groupedTransactions } = useTransactions(selectedMonthTimestamp)

// 是否为当前月份（用于控制图表显示）
const isCurrentMonth = computed(() => {
  const now = new Date()
  const selected = new Date(selectedMonthTimestamp.value)
  return now.getFullYear() === selected.getFullYear() && 
         now.getMonth() === selected.getMonth()
})

// 导航到新建条目
const navigateToEntry = () => {
  router.push('/desktop/entry')
}
</script>

<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">Dashboard</h1>
        <p class="dashboard-subtitle">Mirror of mobile flow, optimized for desktop.</p>
      </div>
      <n-space align="center">
<MonthYearPicker v-model:value="selectedMonthTimestamp" />
        <n-button type="primary" circle @click="navigateToEntry">
          <template #icon>
            <span class="material-symbols-outlined">add</span>
          </template>
        </n-button>
      </n-space>
    </header>

    <!-- 统计卡片 -->
    <n-grid cols="1 s:2 m:3" :x-gap="24" :y-gap="16" responsive="screen" class="stats-grid">
      <n-gi v-for="(card, index) in statsCards" :key="index">
        <n-card class="stats-card" :bordered="true">
          <n-statistic :label="card.label" :value="card.value" tabular-nums>
            <template #suffix>
              <span class="stats-subtitle">{{ card.subtitle }}</span>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- 活动图表（仅当前月份显示） -->
    <n-card v-if="isCurrentMonth" class="activity-chart-card" :bordered="true">
      <!-- 过滤器 -->
      <div class="chart-filters">
        <n-select 
          v-model:value="chartPeriod" 
          :options="periodOptions"
          size="small"
          style="width: 140px"
        />
        <n-radio-group v-model:value="chartType" size="small">
          <n-radio-button value="expense">Expense</n-radio-button>
          <n-radio-button value="both">All</n-radio-button>
        </n-radio-group>
      </div>
      
      <!-- ECharts 图表 -->
      <BarLineChart
        :data="echartsData"
        type="bar"
        :show-income="chartType === 'both'"
        :show-expense="true"
        height="220px"
      />
    </n-card>

    <!-- 本月交易记录 -->
    <n-card class="transactions-card" :bordered="true">
      <template #header>
        <h2 class="transactions-title">Monthly Transactions</h2>
      </template>
      <GroupedTransactionList 
        :groups="groupedTransactions"
        hoverable
        empty-text="No transactions this month"
        empty-icon="event_busy"
      />
    </n-card>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 640px) {
  .dashboard-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.dashboard-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-strong);
  margin: 0;
}

.dashboard-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 4px 0 0 0;
}

.icon-expand {
  font-size: 16px;
  color: var(--color-text-muted);
  margin-left: 4px;
}

/* 统计卡片 */
.stats-grid {
  margin-top: 8px;
}

.stats-card {
  background: var(--color-surface) !important;
  border-color: color-mix(in srgb, var(--color-primary) 20%, transparent) !important;
}

.stats-card :deep(.n-statistic-value) {
  font-size: 1.875rem !important;
  font-weight: 700;
}

.stats-subtitle {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 8px;
}

/* 活动图表 */
.activity-section {
  margin-top: 8px;
}

.activity-chart-card {
  background: var(--color-surface) !important;
  border-color: color-mix(in srgb, var(--color-primary) 20%, transparent) !important;
  height: 100%;
}

/* 图表过滤器 */
.chart-filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}


/* 交易卡片 */
.transactions-card {
  background: var(--color-surface) !important;
  border-color: color-mix(in srgb, var(--color-primary) 20%, transparent) !important;
}

.transactions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.transactions-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-strong);
  margin: 0;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 日期分隔 */
.date-separator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 8px;
  border-bottom: 1px solid var(--color-border);
  margin-top: 8px;
}

.date-separator:first-child {
  margin-top: 0;
}

.date-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-strong);
}

.date-summary {
  display: flex;
  gap: 12px;
  font-size: 0.8125rem;
  font-weight: 500;
}

.day-income {
  color: var(--color-income);
}

.day-expense {
  color: var(--color-expense);
}

.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.transaction-icon.income {
  background: rgba(77, 230, 165, 0.1);
  color: var(--color-income);
}

.transaction-icon.expense {
  background: rgba(239, 95, 154, 0.1);
  color: var(--color-expense);
}

.transaction-amount {
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
}
</style>
