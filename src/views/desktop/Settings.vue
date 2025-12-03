<script setup lang="ts">
/**
 * 设置页面
 * 包含主题设置、应用配置等
 */
import { ref, computed, onMounted, watch } from 'vue'
import { NCard, NSpin, NProgress, NInput, NModal, NSelect, NRadioGroup, NRadio, NButton, useDialog, useMessage } from 'naive-ui'
import { ThemeSwitcher, BackupSelect } from '@/components/common'
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
import {
  loadWebDAVConfig,
  saveWebDAVConfig,
  clearWebDAVConfig,
  testConnection,
  uploadToWebDAV,
  listBackupFiles,
  downloadBackupFile,
  deleteBackupFile,
  loadSyncStatus,
  WEBDAV_PRESETS,
  type WebDAVConfig,
  type SyncStatus,
  type BackupFileInfo
} from '@/services/webdav'

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
async function doImport(data: ExportData, overwrite: boolean = false) {
  try {
    // 覆盖模式下传空数组，这样所有记录都会被当作新记录添加
    const result = await performImport(
      data,
      overwrite ? [] : userStore.categories,
      overwrite ? [] : userStore.transactions,
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

// ==================== WebDAV 同步 ====================
const webdavConfig = ref<WebDAVConfig>({
  serverUrl: '',
  username: '',
  password: '',
  remotePath: '/Qingzhang',
  autoSync: false,
  syncInterval: 30
})
const syncStatus = ref<SyncStatus>({
  lastSyncTime: null,
  lastSyncResult: null,
  isSyncing: false
})
const isConfigured = ref(false)
const isTesting = ref(false)
const isSyncing = ref(false)

// 备份列表弹窗
const showBackupModal = ref(false)
const backupList = ref<BackupFileInfo[]>([])
const selectedBackup = ref<string | null>(null)
const isLoadingBackups = ref(false)
const restoreMode = ref<'merge' | 'overwrite'>('merge')

// 预设选项
const presetOptions = [
  { label: '坚果云', value: 'jianguoyun' },
  { label: 'Nextcloud', value: 'nextcloud' },
  { label: 'ownCloud', value: 'owncloud' },
  { label: '自定义', value: 'custom' }
]
const selectedPreset = ref('custom')

// 备份选项
const backupOptions = computed(() => 
  backupList.value.map(b => ({
    label: b.displayName,
    value: b.filename
  }))
)

// 加载 WebDAV 配置
async function loadConfig() {
  const config = await loadWebDAVConfig()
  if (config) {
    webdavConfig.value = config
    isConfigured.value = true
    
    // 检测预设
    if (config.serverUrl.includes('jianguoyun')) {
      selectedPreset.value = 'jianguoyun'
    }
  }
  
  syncStatus.value = await loadSyncStatus()
}

// 应用预设
function applyPreset(preset: string) {
  const presetConfig = WEBDAV_PRESETS[preset as keyof typeof WEBDAV_PRESETS]
  if (presetConfig) {
    webdavConfig.value.serverUrl = presetConfig.serverUrl
    webdavConfig.value.remotePath = presetConfig.defaultPath
  }
}

// 监听预设变化
watch(selectedPreset, (preset) => {
  applyPreset(preset)
})

// 测试连接
async function handleTestConnection() {
  if (!webdavConfig.value.serverUrl || !webdavConfig.value.username) {
    message.warning('Please fill in server URL and username')
    return
  }
  
  isTesting.value = true
  try {
    const result = await testConnection(webdavConfig.value)
    if (result.success) {
      message.success(result.message)
    } else {
      message.error(result.message)
    }
  } catch (error) {
    message.error('Connection test failed')
  } finally {
    isTesting.value = false
  }
}

// 保存配置
async function handleSaveConfig() {
  if (!webdavConfig.value.serverUrl || !webdavConfig.value.username) {
    message.warning('Please fill in required fields')
    return
  }
  
  try {
    await saveWebDAVConfig(webdavConfig.value)
    isConfigured.value = true
    message.success('WebDAV configuration saved')
  } catch (error) {
    message.error('Failed to save configuration')
  }
}

// 清除配置
async function handleClearConfig() {
  dialog.warning({
    title: 'Clear WebDAV Configuration',
    content: 'This will remove all WebDAV settings. Continue?',
    positiveText: 'Clear',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      await clearWebDAVConfig()
      webdavConfig.value = {
        serverUrl: '',
        username: '',
        password: '',
        remotePath: '/Qingzhang',
        autoSync: false,
        syncInterval: 30
      }
      isConfigured.value = false
      message.success('Configuration cleared')
    }
  })
}

// 上传到云端
async function handleUpload() {
  if (!isConfigured.value) {
    message.warning('Please configure WebDAV first')
    return
  }
  
  isSyncing.value = true
  try {
    const result = await uploadToWebDAV(
      webdavConfig.value,
      userStore.transactions,
      userStore.categories,
      currencyStore.primaryCurrency
    )
    
    if (result.success) {
      message.success(result.message)
      syncStatus.value = await loadSyncStatus()
    } else {
      message.error(result.error || 'Upload failed')
    }
  } catch (error) {
    message.error('Upload failed')
  } finally {
    isSyncing.value = false
  }
}

// 打开备份选择弹窗
async function handleDownload() {
  if (!isConfigured.value) {
    message.warning('Please configure WebDAV first')
    return
  }
  
  isLoadingBackups.value = true
  showBackupModal.value = true
  
  try {
    backupList.value = await listBackupFiles(webdavConfig.value)
    if (backupList.value.length > 0) {
      selectedBackup.value = backupList.value[0].filename
    } else {
      message.info('No backup files found on server')
    }
  } catch (error) {
    message.error('Failed to load backup list')
  } finally {
    isLoadingBackups.value = false
  }
}

// 执行恢复操作
async function handleRestore() {
  if (!selectedBackup.value) {
    message.warning('Please select a backup')
    return
  }
  
  isSyncing.value = true
  try {
    const result = await downloadBackupFile(webdavConfig.value, selectedBackup.value)
    
    if (result.success && result.data) {
      showBackupModal.value = false
      
      if (restoreMode.value === 'overwrite') {
        // 覆盖模式：先清空现有数据
        dialog.warning({
          title: 'Overwrite Data',
          content: `This will replace all your current data with ${result.data.transactions.length} transactions and ${result.data.categories.length} categories. Continue?`,
          positiveText: 'Overwrite',
          negativeText: 'Cancel',
          onPositiveClick: async () => {
            await doImport(result.data!, true)
            syncStatus.value = await loadSyncStatus()
            message.success('Data restored successfully')
          }
        })
      } else {
        // 合并模式
        dialog.info({
          title: 'Merge Data',
          content: `Found ${result.data.transactions.length} transactions and ${result.data.categories.length} categories. New records will be added to your existing data.`,
          positiveText: 'Merge',
          negativeText: 'Cancel',
          onPositiveClick: async () => {
            await doImport(result.data!, false)
            syncStatus.value = await loadSyncStatus()
            message.success('Data merged successfully')
          }
        })
      }
    } else {
      message.error(result.error || 'Download failed')
    }
  } catch (error) {
    message.error('Restore failed')
  } finally {
    isSyncing.value = false
  }
}

// 删除备份
async function handleDeleteBackup(filename: string) {
  dialog.warning({
    title: 'Delete Backup',
    content: 'Are you sure you want to delete this backup?',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      const success = await deleteBackupFile(webdavConfig.value, filename)
      if (success) {
        backupList.value = backupList.value.filter(b => b.filename !== filename)
        if (selectedBackup.value === filename) {
          selectedBackup.value = backupList.value[0]?.filename || null
        }
        message.success('Backup deleted')
      } else {
        message.error('Failed to delete backup')
      }
    }
  })
}

// 初始化加载配置
onMounted(() => {
  loadConfig()
})
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

      <!-- WebDAV 云同步 -->
      <n-card class="settings-card" title="Cloud Sync (WebDAV)">
        <template #header-extra>
          <span class="material-symbols-outlined">cloud_sync</span>
        </template>
        
        <!-- 服务商预设 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Service Provider</span>
            <span class="setting-description">Select your WebDAV provider or use custom</span>
          </div>
          <n-select
            v-model:value="selectedPreset"
            :options="presetOptions"
            style="width: 160px"
          />
        </div>
        
        <!-- 服务器地址 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Server URL</span>
            <span class="setting-description">WebDAV server address</span>
          </div>
          <n-input
            v-model:value="webdavConfig.serverUrl"
            placeholder="https://dav.example.com"
            style="width: 280px"
          />
        </div>
        
        <!-- 用户名 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Username</span>
            <span class="setting-description">Your account username</span>
          </div>
          <n-input
            v-model:value="webdavConfig.username"
            placeholder="username"
            style="width: 200px"
          />
        </div>
        
        <!-- 密码 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Password</span>
            <span class="setting-description">App-specific password recommended</span>
          </div>
          <n-input
            v-model:value="webdavConfig.password"
            type="password"
            show-password-on="click"
            placeholder="password"
            style="width: 200px"
          />
        </div>
        
        <!-- 远程路径 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Remote Path</span>
            <span class="setting-description">Folder path on server</span>
          </div>
          <n-input
            v-model:value="webdavConfig.remotePath"
            placeholder="/Qingzhang"
            style="width: 160px"
          />
        </div>
        
        <!-- 配置操作按钮 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Configuration</span>
            <span class="setting-description">Test connection and save settings</span>
          </div>
          <div class="export-buttons">
            <button class="setting-btn" :disabled="isTesting" @click="handleTestConnection">
              <n-spin v-if="isTesting" :size="14" />
              <span v-else>Test</span>
            </button>
            <button class="setting-btn" @click="handleSaveConfig">Save</button>
            <button v-if="isConfigured" class="setting-btn danger" @click="handleClearConfig">Clear</button>
          </div>
        </div>
        
        <!-- 同步操作 -->
        <div v-if="isConfigured" class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Sync Actions</span>
            <span class="setting-description">
              {{ syncStatus.lastSyncTime ? `Last sync: ${new Date(syncStatus.lastSyncTime).toLocaleString()}` : 'Never synced' }}
            </span>
          </div>
          <div class="export-buttons">
            <button class="setting-btn primary" :disabled="isSyncing" @click="handleUpload">
              <n-spin v-if="isSyncing" :size="14" />
              <template v-else>
                <span class="material-symbols-outlined" style="font-size: 16px;">cloud_upload</span>
                Upload
              </template>
            </button>
            <button class="setting-btn" :disabled="isSyncing" @click="handleDownload">
              <n-spin v-if="isSyncing" :size="14" />
              <template v-else>
                <span class="material-symbols-outlined" style="font-size: 16px;">cloud_download</span>
                Download
              </template>
            </button>
          </div>
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

    <!-- 备份选择弹窗 -->
    <n-modal
      v-model:show="showBackupModal"
      preset="card"
      title="Select Backup to Restore"
      style="width: 500px; max-width: 90vw;"
      :mask-closable="!isSyncing"
    >
      <div class="backup-modal-content">
        <!-- 加载状态 -->
        <div v-if="isLoadingBackups" class="backup-loading">
          <n-spin size="medium" />
          <span>Loading backup list...</span>
        </div>
        
        <!-- 无备份 -->
        <div v-else-if="backupList.length === 0" class="backup-empty">
          <span class="material-symbols-outlined">cloud_off</span>
          <p>No backups found on server</p>
        </div>
        
        <!-- 备份列表 -->
        <template v-else>
          <div class="backup-select-wrapper">
            <label class="backup-label">Select backup:</label>
            <BackupSelect
              v-model="selectedBackup"
              :options="backupOptions"
              placeholder="Select a backup"
              @delete="handleDeleteBackup"
            />
          </div>
          
          <!-- 恢复模式 -->
          <div class="restore-mode-wrapper">
            <label class="backup-label">Restore mode:</label>
            <n-radio-group v-model:value="restoreMode">
              <n-radio value="merge">
                <div class="mode-option">
                  <span class="mode-title">Merge</span>
                  <span class="mode-desc">Add new records to existing data</span>
                </div>
              </n-radio>
              <n-radio value="overwrite">
                <div class="mode-option">
                  <span class="mode-title">Overwrite</span>
                  <span class="mode-desc">Replace all current data</span>
                </div>
              </n-radio>
            </n-radio-group>
          </div>
          
          <!-- 操作按钮 -->
          <div class="backup-actions">
            <n-button @click="showBackupModal = false">Cancel</n-button>
            <n-button 
              type="primary" 
              :loading="isSyncing" 
              :disabled="!selectedBackup"
              @click="handleRestore"
            >
              Restore
            </n-button>
          </div>
        </template>
      </div>
    </n-modal>
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

.setting-btn.primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-background);
}

.setting-btn.primary:hover {
  background: color-mix(in srgb, var(--color-primary) 85%, white);
}

.setting-btn.danger {
  border-color: var(--color-expense);
  color: var(--color-expense);
}

.setting-btn.danger:hover {
  background: color-mix(in srgb, var(--color-expense) 15%, transparent);
}

.setting-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* 备份弹窗样式 */
.backup-modal-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.backup-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  color: var(--color-text-muted);
}

.backup-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 0;
  color: var(--color-text-muted);
}

.backup-empty .material-symbols-outlined {
  font-size: 48px;
  opacity: 0.5;
}

.backup-select-wrapper,
.restore-mode-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.backup-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-strong);
}

.restore-mode-wrapper :deep(.n-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mode-title {
  font-weight: 500;
  color: var(--color-text-strong);
}

.mode-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.backup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}
</style>
