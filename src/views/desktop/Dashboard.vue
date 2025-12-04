<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
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
  useCurrencyFormat, 
  useChartData,
  useTransactions
} from '@/hooks'
import { GroupedTransactionList, MonthYearPicker, BarLineChart, EditTransactionModal } from '@/components/desktop'
import type { Transaction } from '@/types'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const { format: formatCurrency } = useCurrencyFormat()

// 编辑弹窗状态
const showEditModal = ref(false)
const editingTransaction = ref<Transaction | null>(null)

// 统计卡片数据
const statsCards = computed(() => [
  {
    label: t('dashboard.currentBalance'),
    value: formatCurrency(userStore.statistics.totalBalance),
    valueColor: 'var(--color-text-strong)'
  },
  {
    label: t('dashboard.monthlyIncome'),
    value: formatCurrency(userStore.statistics.monthlyIncome),
    valueColor: 'var(--color-income)'
  },
  {
    label: t('dashboard.monthlySpending'),
    value: formatCurrency(userStore.statistics.monthlyExpense),
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

// 编辑交易记录
const handleEdit = (transaction: Transaction) => {
  editingTransaction.value = transaction
  showEditModal.value = true
}

// 删除交易记录
const handleDelete = async (transaction: Transaction) => {
  await userStore.deleteTransaction(transaction.id)
}
</script>

<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">{{ t('dashboard.title') }}</h1>
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
          <n-statistic :label="card.label" :value="card.value" tabular-nums />
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
          <n-radio-button value="expense">{{ t('reports.expense') }}</n-radio-button>
          <n-radio-button value="both">{{ t('common.all') }}</n-radio-button>
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
        <h2 class="transactions-title">{{ t('dashboard.monthlyTransactions') }}</h2>
      </template>
      <GroupedTransactionList 
        :groups="groupedTransactions"
        hoverable
        :empty-text="t('dashboard.noTransactions')"
        empty-icon="event_busy"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </n-card>

    <!-- 编辑弹窗 -->
    <EditTransactionModal
      v-model:show="showEditModal"
      :transaction="editingTransaction"
    />
  </div>
</template>

<!-- 样式已提取到 @/styles/views/dashboard.css -->
