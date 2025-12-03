<script setup lang="ts">
/**
 * 设置页面
 * 包含主题设置、应用配置等
 */
import { ref, computed, onMounted, watch } from 'vue'
import { NCard, NSelect, NSpin, NProgress, useDialog, useMessage } from 'naive-ui'
import { ThemeSwitcher } from '@/components/common'
import { useCurrencyStore, useUserStore } from '@/stores'
import type { CurrencyCode } from '@/types'
import {
  exportAndDownload,
  exportCSVAndDownload,
  parseImportFile,
  parseCSVImportFile,
  performImport,
  getImportStats,
  type ExportData,
  type CSVImportResult
} from '@/services/data-transfer'

const currencyStore = useCurrencyStore()
const userStore = useUserStore()
const dialog = useDialog()
const message = useMessage()

// 币种选项
const currencyOptions = computed(() => 
  currencyStore.availableCurrencies.map(c => ({
    label: `${c.flag} ${c.code} - ${c.name}`,
    value: c.code
  }))
)

// 记录上一次的币种
const previousCurrency = ref<CurrencyCode>(currencyStore.primaryCurrency)

// 当前选中的币种
const selectedCurrency = computed({
  get: () => currencyStore.primaryCurrency,
  set: (val: CurrencyCode) => handleCurrencyChange(val)
})

// 处理币种变更
async function handleCurrencyChange(newCurrency: CurrencyCode) {
  const oldCurrency = previousCurrency.value
  
  if (newCurrency === oldCurrency) return
  
  // 先更新币种
  await currencyStore.setPrimaryCurrency(newCurrency)
  
  // 如果有交易记录，询问是否重新计算
  if (userStore.transactions.length > 0) {
    dialog.warning({
      title: 'Recalculate Transactions?',
      content: `You've changed your primary currency from ${oldCurrency} to ${newCurrency}. 
        Would you like to recalculate all transaction amounts using historical exchange rates? 
        This ensures accurate reports based on the exchange rate at the time of each transaction.`,
      positiveText: 'Recalculate',
      negativeText: 'Skip',
      onPositiveClick: async () => {
        await recalculateTransactions()
      },
      onNegativeClick: () => {
        message.info('You can recalculate later using the button below')
      }
    })
  }
  
  previousCurrency.value = newCurrency
}

// 重新计算所有交易
async function recalculateTransactions() {
  const result = await currencyStore.recalculateAllTransactions(
    userStore.transactions,
    userStore.updateTransaction
  )
  
  if (result.failed === 0 && result.usedFallback === 0) {
    message.success(`Successfully recalculated ${result.success} transactions`)
  } else if (result.failed === 0 && result.usedFallback > 0) {
    message.warning(`Recalculated ${result.success} transactions. ${result.usedFallback} used current rates (historical unavailable)`)
  } else {
    message.error(`Recalculated ${result.success} transactions, ${result.failed} failed`)
  }
}

// 汇率更新时间
const ratesLastUpdated = computed(() => {
  if (!currencyStore.lastUpdated) return 'Not updated'
  return currencyStore.lastUpdated.toLocaleString()
})

onMounted(() => {
  currencyStore.initialize()
  previousCurrency.value = currencyStore.primaryCurrency
})

// 监听初始化完成后同步 previousCurrency
watch(() => currencyStore.isInitialized, (initialized) => {
  if (initialized) {
    previousCurrency.value = currencyStore.primaryCurrency
  }
})

// ==================== 数据导出/导入 ====================
const isExporting = ref(false)
const isImporting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 导出数据为 JSON
async function exportData() {
  isExporting.value = true
  
  try {
    const result = await exportAndDownload(
      userStore.transactions,
      userStore.categories,
      currencyStore.primaryCurrency
    )
    
    if (result.success) {
      if (result.path) {
        message.success(`Exported to: ${result.path}`)
      } else {
        message.success(`Exported ${userStore.transactions.length} transactions and ${userStore.categories.length} categories`)
      }
    } else if (result.error !== 'User cancelled') {
      message.error(`Export failed: ${result.error}`)
    }
  } catch (error) {
    console.error('Export failed:', error)
    message.error('Failed to export data')
  } finally {
    isExporting.value = false
  }
}

// 导出为 CSV
async function exportAsCSV() {
  isExporting.value = true
  
  try {
    const result = await exportCSVAndDownload(userStore.transactions)
    
    if (result.success) {
      if (result.path) {
        message.success(`Exported to: ${result.path}`)
      } else {
        message.success(`Exported ${userStore.transactions.length} transactions to CSV`)
      }
    } else if (result.error !== 'User cancelled') {
      message.error(`Export failed: ${result.error}`)
    }
  } catch (error) {
    console.error('Export failed:', error)
    message.error('Failed to export data')
  } finally {
    isExporting.value = false
  }
}

// 触发文件选择
function triggerImport() {
  fileInputRef.value?.click()
}

// 处理文件导入
async function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  isImporting.value = true
  
  try {
    const fileName = file.name.toLowerCase()
    
    // 根据文件类型选择解析方式
    if (fileName.endsWith('.csv')) {
      await handleCSVImport(file)
    } else if (fileName.endsWith('.json')) {
      await handleJSONImport(file)
    } else {
      message.error('Unsupported file format. Please use .json or .csv files.')
    }
  } catch (error) {
    console.error('Import failed:', error)
    message.error('Failed to parse import file. Please check the file format.')
  } finally {
    isImporting.value = false
    // 重置 input 以允许重新选择同一文件
    target.value = ''
  }
}

// 处理 JSON 文件导入
async function handleJSONImport(file: File) {
  const result = await parseImportFile(file)
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to parse file')
  }
  
  const data = result.data
  const stats = getImportStats(data)
  
  dialog.warning({
    title: 'Import JSON Data',
    content: `Found ${stats.transactionsCount} transactions and ${stats.categoriesCount} categories.
      ${stats.dateRange ? `Date range: ${stats.dateRange.start} to ${stats.dateRange.end}` : ''}
      Existing data with the same ID will be skipped. Continue?`,
    positiveText: 'Import',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      await doImport(data)
    }
  })
}

// 处理 CSV 文件导入
async function handleCSVImport(file: File) {
  const result = await parseCSVImportFile(file)
  
  if (!result.success || result.transactions.length === 0) {
    const errorMsg = result.errors.length > 0 
      ? result.errors.slice(0, 3).join('; ') 
      : 'No valid transactions found'
    message.error(`CSV import failed: ${errorMsg}`)
    return
  }
  
  // 计算日期范围
  const dates = result.transactions.map(t => t.date).sort()
  const dateRange = dates.length > 0 
    ? `${dates[0]} to ${dates[dates.length - 1]}`
    : ''
  
  dialog.warning({
    title: 'Import CSV Data',
    content: `Found ${result.transactions.length} transactions.
      ${dateRange ? `Date range: ${dateRange}` : ''}
      ${result.skipped > 0 ? `Skipped ${result.skipped} invalid rows.` : ''}
      ${result.errors.length > 0 ? `${result.errors.length} errors encountered.` : ''}
      Continue with import?`,
    positiveText: 'Import',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      await doCSVImport(result)
    }
  })
}

// 执行 CSV 导入
async function doCSVImport(result: CSVImportResult) {
  try {
    let imported = 0
    let skipped = 0
    let failed = 0
    
    for (const txn of result.transactions) {
      try {
        // 智能去重：按内容判断是否已存在
        const existsByContent = userStore.transactions.find(t => 
          t.date === txn.date &&
          t.amount === txn.amount &&
          t.type === txn.type &&
          (t.description || '') === (txn.description || '')
        )
        
        if (existsByContent) {
          skipped++
          continue
        }
        
        // 查找或使用默认分类
        let category = userStore.categories.find(
          c => c.name.toLowerCase() === txn.category.toLowerCase() && c.type === txn.type
        )
        
        // 如果分类不存在，使用第一个同类型分类或创建新分类
        if (!category) {
          category = userStore.categories.find(c => c.type === txn.type)
          if (!category) {
            // 创建默认分类
            await userStore.addCategory({
              name: txn.category || 'Other',
              icon: txn.type === 'income' ? 'attach_money' : 'receipt',
              type: txn.type
            })
            category = userStore.categories.find(c => c.name === (txn.category || 'Other'))
          }
        }
        
        await userStore.addTransaction({
          type: txn.type,
          amount: txn.amount,
          currency: txn.currency as any,
          convertedAmount: txn.convertedAmount,
          exchangeRate: txn.exchangeRate,
          category: category?.name || 'Other',
          categoryIcon: category?.icon || 'receipt',
          description: txn.description,
          date: txn.date
        })
        imported++
      } catch (e) {
        console.error('Failed to import transaction:', e)
        failed++
      }
    }
    
    let msg = `Imported ${imported} transactions`
    if (skipped > 0) msg += `, ${skipped} duplicates skipped`
    if (failed > 0) msg += `, ${failed} failed`
    
    if (failed === 0) {
      message.success(msg)
    } else {
      message.warning(msg)
    }
  } catch (error) {
    console.error('CSV import failed:', error)
    message.error('Failed to import CSV data')
  }
}

// 执行导入
async function doImport(data: ExportData) {
  try {
    const result = await performImport(
      data,
      userStore.categories,
      userStore.transactions,
      userStore.addCategory,
      userStore.addTransaction
    )
    
    if (result.success) {
      // 更新主币种设置（如果有）
      if (data.settings?.primaryCurrency) {
        await currencyStore.setPrimaryCurrency(data.settings.primaryCurrency)
      }
      
      message.success(
        `Imported ${result.transactionsImported} transactions and ${result.categoriesImported} categories` +
        (result.transactionsSkipped > 0 ? ` (${result.transactionsSkipped} skipped)` : '')
      )
    } else {
      message.error(`Import failed: ${result.error}`)
    }
  } catch (error) {
    console.error('Import failed:', error)
    message.error('Failed to import data')
  }
}
</script>

<template>
  <div class="settings">
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Customize your app experience</p>
      </div>
    </header>

    <div class="settings-content">
      <!-- 外观设置 -->
      <n-card class="settings-card" title="Appearance">
        <template #header-extra>
          <span class="material-symbols-outlined">palette</span>
        </template>
        <ThemeSwitcher />
      </n-card>

      <!-- 币种设置 -->
      <n-card class="settings-card" title="Currency">
        <template #header-extra>
          <span class="material-symbols-outlined">currency_exchange</span>
        </template>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Primary Currency</span>
            <span class="setting-description">All transactions will be converted to this currency for reports</span>
          </div>
          <n-select
            v-model:value="selectedCurrency"
            :options="currencyOptions"
            style="width: 220px"
            :loading="currencyStore.isLoadingRates"
          />
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Exchange Rates</span>
            <span class="setting-description">Powered by Frankfurter API (ECB rates)</span>
          </div>
          <div class="rates-info">
            <span class="rates-status" :class="{ loading: currencyStore.isLoadingRates }">
              <n-spin v-if="currencyStore.isLoadingRates" :size="14" />
              <span v-else class="material-symbols-outlined">check_circle</span>
              {{ currencyStore.isLoadingRates ? 'Updating...' : 'Updated' }}
            </span>
            <button class="setting-btn" @click="currencyStore.fetchExchangeRates">
              <span class="material-symbols-outlined">refresh</span>
              Refresh
            </button>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Last Updated</span>
            <span class="setting-description">Exchange rate data timestamp</span>
          </div>
          <span class="setting-value">{{ ratesLastUpdated }}</span>
        </div>
        <!-- 重新计算交易 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Recalculate Transactions</span>
            <span class="setting-description">Update all amounts using historical exchange rates</span>
          </div>
          <div class="recalculate-actions">
            <n-progress 
              v-if="currencyStore.isRecalculating" 
              type="line" 
              :percentage="currencyStore.recalculationProgress"
              :show-indicator="true"
              style="width: 120px"
            />
            <button 
              class="setting-btn" 
              :disabled="currencyStore.isRecalculating || userStore.transactions.length === 0"
              @click="recalculateTransactions"
            >
              <span class="material-symbols-outlined">calculate</span>
              {{ currencyStore.isRecalculating ? 'Processing...' : 'Recalculate' }}
            </button>
          </div>
        </div>
      </n-card>

      <!-- 通用设置 -->
      <n-card class="settings-card" title="General">
        <template #header-extra>
          <span class="material-symbols-outlined">tune</span>
        </template>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Language</span>
            <span class="setting-description">App display language</span>
          </div>
          <span class="setting-value">English</span>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Date Format</span>
            <span class="setting-description">How dates are displayed</span>
          </div>
          <span class="setting-value">YYYY-MM-DD</span>
        </div>
      </n-card>

      <!-- 数据管理 -->
      <n-card class="settings-card" title="Data">
        <template #header-extra>
          <span class="material-symbols-outlined">database</span>
        </template>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Export Data</span>
            <span class="setting-description">Download your transaction history</span>
          </div>
          <div class="export-buttons">
            <button class="setting-btn" :disabled="isExporting" @click="exportData">
              <n-spin v-if="isExporting" :size="14" />
              <span v-else>JSON</span>
            </button>
            <button class="setting-btn" :disabled="isExporting" @click="exportAsCSV">
              <n-spin v-if="isExporting" :size="14" />
              <span v-else>CSV</span>
            </button>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Import Data</span>
            <span class="setting-description">Import from JSON or CSV file</span>
          </div>
          <button class="setting-btn" :disabled="isImporting" @click="triggerImport">
            <n-spin v-if="isImporting" :size="14" />
            <span v-else>Import</span>
          </button>
          <!-- 隐藏的文件输入 -->
          <input
            ref="fileInputRef"
            type="file"
            accept=".json,.csv"
            style="display: none"
            @change="handleFileImport"
          />
        </div>
      </n-card>

      <!-- 关于 -->
      <n-card class="settings-card" title="About">
        <template #header-extra>
          <span class="material-symbols-outlined">info</span>
        </template>
        <div class="about-info">
          <div class="app-logo">
            <img src="@/assets/logo.svg" alt="青账" class="logo-img" />
            <div class="logo-text">
              <span class="app-name">青账 Qingzhang</span>
              <span class="app-version">Version 1.0.0</span>
            </div>
          </div>
          <p class="app-description">
            跨平台个人财务管理应用，基于 Vue 3 + Tauri 构建。
          </p>
        </div>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.settings {
  padding: 8px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-strong);
  margin: 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 4px 0 0 0;
}

.settings-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.settings-card {
  background: var(--color-surface) !important;
  border-color: color-mix(in srgb, var(--color-primary) 20%, transparent) !important;
}

.settings-card :deep(.n-card-header) {
  padding-bottom: 12px;
}

.settings-card :deep(.n-card-header__main) {
  font-weight: 600;
  font-size: 1rem;
}

.settings-card :deep(.n-card-header__extra) {
  color: var(--color-primary);
}

/* 设置项 */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-border);
}

.setting-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-item:first-child {
  padding-top: 0;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-weight: 500;
  color: var(--color-text-strong);
}

.setting-description {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.setting-value {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.setting-btn {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-strong);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.setting-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.setting-btn .material-symbols-outlined {
  font-size: 16px;
  margin-right: 4px;
}

/* 导出按钮组 */
.export-buttons {
  display: flex;
  gap: 8px;
}

/* 汇率信息 */
.rates-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rates-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: var(--color-primary);
}

.rates-status .material-symbols-outlined {
  font-size: 16px;
}

.rates-status.loading {
  color: var(--color-text-muted);
}

/* 重新计算操作 */
.recalculate-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setting-btn:disabled:hover {
  border-color: var(--color-border);
  color: var(--color-text-strong);
}

/* 关于区域 */
.about-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-img {
  width: 48px;
  height: 48px;
  border-radius: 12px;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.app-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-strong);
}

.app-version {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.app-description {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
}
</style>
