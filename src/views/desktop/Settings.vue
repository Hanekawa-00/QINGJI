<script setup lang="ts">
/**
 * 设置页面
 * 包含主题设置、应用配置等
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NCard, NSpin, NProgress, NInput, NModal, NSelect, NRadioGroup, NRadio, NButton, useDialog, useMessage } from 'naive-ui'
import { ThemeSwitcher, BackupSelect } from '@/components/common'
import { useCurrencyStore, useUserStore } from '@/stores'
import { localeOptions, setLocale, getLocale, type Locale } from '@/locales'
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

const { t } = useI18n()
const currencyStore = useCurrencyStore()
const userStore = useUserStore()
const dialog = useDialog()
const message = useMessage()

// 语言切换
const currentLocale = ref<Locale>(getLocale())
const languageOptions = localeOptions.map(opt => ({
  label: opt.label,
  value: opt.value
}))

function handleLocaleChange(locale: Locale) {
  setLocale(locale)
  currentLocale.value = locale
}

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
      title: t('settings.recalculateDialog.title'),
      content: t('settings.recalculateDialog.content', { old: oldCurrency, new: newCurrency }),
      positiveText: t('settings.recalculateDialog.confirm'),
      negativeText: t('settings.recalculateDialog.skip'),
      onPositiveClick: async () => {
        await recalculateTransactions()
      },
      onNegativeClick: () => {
        message.info(t('settings.recalculateDialog.skipMessage'))
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
    message.success(t('messages.recalculateSuccess', { count: result.success }))
  } else if (result.failed === 0 && result.usedFallback > 0) {
    message.warning(t('messages.recalculatePartial', { success: result.success, fallback: result.usedFallback }))
  } else {
    message.error(t('messages.recalculateFailed', { success: result.success, failed: result.failed }))
  }
}

// 汇率更新时间
const ratesLastUpdated = computed(() => {
  if (!currencyStore.lastUpdated) return t('settings.notUpdated')
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
        message.success(t('messages.exportedTo', { path: result.path }))
      } else {
        message.success(t('messages.exportedTransactions', { transactions: userStore.transactions.length, categories: userStore.categories.length }))
      }
    } else if (result.error !== 'User cancelled') {
      message.error(t('messages.exportFailed') + ': ' + result.error)
    }
  } catch (error) {
    console.error('Export failed:', error)
    message.error(t('messages.exportFailed'))
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
        message.success(t('messages.exportedTo', { path: result.path }))
      } else {
        message.success(t('messages.exportedToCSV', { count: userStore.transactions.length }))
      }
    } else if (result.error !== 'User cancelled') {
      message.error(t('messages.exportFailed') + ': ' + result.error)
    }
  } catch (error) {
    console.error('Export failed:', error)
    message.error(t('messages.exportFailed'))
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
      message.error(t('messages.unsupportedFormat'))
    }
  } catch (error) {
    console.error('Import failed:', error)
    message.error(t('messages.parseError'))
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
  
  const dateRangeText = stats.dateRange 
    ? t('messages.importDateRange', { start: stats.dateRange.start, end: stats.dateRange.end })
    : ''
  
  dialog.warning({
    title: t('settings.importJSONTitle'),
    content: t('messages.importPreview', { transactions: stats.transactionsCount, categories: stats.categoriesCount }) +
      (dateRangeText ? ' ' + dateRangeText : '') + ' ' +
      t('messages.importSkipExisting'),
    positiveText: t('settings.import'),
    negativeText: t('common.cancel'),
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
      : t('messages.noValidTransactions')
    message.error(t('messages.csvImportFailed', { error: errorMsg }))
    return
  }
  
  // 计算日期范围
  const dates = result.transactions.map(t => t.date).sort()
  const dateRangeText = dates.length > 0 
    ? t('messages.importDateRange', { start: dates[0], end: dates[dates.length - 1] })
    : ''
  
  let contentParts = [t('messages.csvPreview', { count: result.transactions.length })]
  if (dateRangeText) contentParts.push(dateRangeText)
  if (result.skipped > 0) contentParts.push(t('messages.csvSkipped', { count: result.skipped }))
  if (result.errors.length > 0) contentParts.push(t('messages.csvErrors', { count: result.errors.length }))
  contentParts.push(t('messages.csvContinue'))
  
  dialog.warning({
    title: t('settings.importCSVTitle'),
    content: contentParts.join(' '),
    positiveText: t('settings.import'),
    negativeText: t('common.cancel'),
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
    
    let msg = t('messages.csvImportResult', { success: imported })
    if (skipped > 0) msg += t('messages.csvDuplicatesSkipped', { count: skipped })
    if (failed > 0) msg += t('messages.csvImportPartial', { failed })
    
    if (failed === 0) {
      message.success(msg)
    } else {
      message.warning(msg)
    }
  } catch (error) {
    console.error('CSV import failed:', error)
    message.error(t('messages.importFailed'))
  }
}

// 执行导入
async function doImport(data: ExportData, overwrite: boolean = false) {
  try {
    // 覆盖模式下先清除所有现有数据
    if (overwrite) {
      await userStore.clearAllData()
    }
    
    // 执行导入
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
      
      let msg = t('messages.importedResult', { 
        transactions: result.transactionsImported, 
        categories: result.categoriesImported 
      })
      if (result.transactionsSkipped > 0) {
        msg += t('messages.importedWithSkip', { skipped: result.transactionsSkipped })
      }
      message.success(msg)
    } else {
      message.error(t('messages.importFailed') + ': ' + result.error)
    }
  } catch (error) {
    console.error('Import failed:', error)
    message.error(t('messages.importFailed'))
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

// Preset options
const presetOptions = [
  { label: 'Jianguoyun', value: 'jianguoyun' },
  { label: 'Nextcloud', value: 'nextcloud' },
  { label: 'ownCloud', value: 'owncloud' },
  { label: 'Custom', value: 'custom' }
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
    message.warning(t('messages.fillServerAndUsername'))
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
    message.error(t('messages.testFailed'))
  } finally {
    isTesting.value = false
  }
}

// 保存配置
async function handleSaveConfig() {
  if (!webdavConfig.value.serverUrl || !webdavConfig.value.username) {
    message.warning(t('messages.fillRequired'))
    return
  }
  
  try {
    await saveWebDAVConfig(webdavConfig.value)
    isConfigured.value = true
    message.success(t('messages.configSaved'))
  } catch (error) {
    message.error(t('messages.saveFailed'))
  }
}

// 清除配置
async function handleClearConfig() {
  dialog.warning({
    title: t('settings.clearConfig'),
    content: t('settings.clearConfigContent'),
    positiveText: t('common.clear'),
    negativeText: t('common.cancel'),
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
      message.success(t('messages.configCleared'))
    }
  })
}

// 上传到云端
async function handleUpload() {
  if (!isConfigured.value) {
    message.warning(t('messages.configureWebDAVFirst'))
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
      message.success(t('messages.uploadSuccess'))
      syncStatus.value = await loadSyncStatus()
    } else {
      message.error(result.error || t('messages.uploadFailed'))
    }
  } catch (error) {
    message.error(t('messages.uploadFailed'))
  } finally {
    isSyncing.value = false
  }
}

// 打开备份选择弹窗
async function handleDownload() {
  if (!isConfigured.value) {
    message.warning(t('messages.configureWebDAVFirst'))
    return
  }
  
  isLoadingBackups.value = true
  showBackupModal.value = true
  
  try {
    backupList.value = await listBackupFiles(webdavConfig.value)
    if (backupList.value.length > 0) {
      selectedBackup.value = backupList.value[0].filename
    } else {
      message.info(t('messages.noBackupsFound'))
    }
  } catch (error) {
    message.error(t('messages.loadBackupsFailed'))
  } finally {
    isLoadingBackups.value = false
  }
}

// 执行恢复操作
async function handleRestore() {
  if (!selectedBackup.value) {
    message.warning(t('messages.selectBackupFirst'))
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
          title: t('settings.overwriteDialog.title'),
          content: t('settings.overwriteDialog.content', { 
            transactions: result.data.transactions.length, 
            categories: result.data.categories.length 
          }),
          positiveText: t('settings.overwriteDialog.confirm'),
          negativeText: t('common.cancel'),
          onPositiveClick: async () => {
            await doImport(result.data!, true)
            syncStatus.value = await loadSyncStatus()
            message.success(t('messages.dataRestored'))
          }
        })
      } else {
        // 合并模式
        dialog.info({
          title: t('settings.mergeDialog.title'),
          content: t('settings.mergeDialog.content', { 
            transactions: result.data.transactions.length, 
            categories: result.data.categories.length 
          }),
          positiveText: t('settings.mergeDialog.confirm'),
          negativeText: t('common.cancel'),
          onPositiveClick: async () => {
            await doImport(result.data!, false)
            syncStatus.value = await loadSyncStatus()
            message.success(t('messages.dataMerged'))
          }
        })
      }
    } else {
      message.error(result.error || t('messages.downloadFailed'))
    }
  } catch (error) {
    message.error(t('messages.restoreFailed'))
  } finally {
    isSyncing.value = false
  }
}

// 删除备份
async function handleDeleteBackup(filename: string) {
  dialog.warning({
    title: t('settings.deleteBackup'),
    content: t('settings.deleteBackupContent'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      const success = await deleteBackupFile(webdavConfig.value, filename)
      if (success) {
        backupList.value = backupList.value.filter(b => b.filename !== filename)
        if (selectedBackup.value === filename) {
          selectedBackup.value = backupList.value[0]?.filename || null
        }
        message.success(t('messages.backupDeleted'))
      } else {
        message.error(t('messages.backupDeleteFailed'))
      }
    }
  })
}

// 清空所有数据
async function handleClearAllData() {
  dialog.error({
    title: t('settings.clearDataDialog.title'),
    content: t('settings.clearDataDialog.content'),
    positiveText: t('settings.clearDataDialog.confirm'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await userStore.clearAllData()
        message.success(t('messages.deleteSuccess'))
      } catch (error) {
        console.error('Failed to clear data:', error)
        message.error(t('messages.deleteFailed'))
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
        <h1 class="page-title">{{ t('settings.title') }}</h1>
        <p class="page-subtitle">{{ t('settings.subtitle') }}</p>
      </div>
    </header>

    <div class="settings-content">
      <!-- 外观设置 -->
      <n-card class="settings-card" :title="t('settings.appearance')">
        <template #header-extra>
          <span class="material-symbols-outlined">palette</span>
        </template>
        <ThemeSwitcher />
      </n-card>

      <!-- 币种设置 -->
      <n-card class="settings-card" :title="t('settings.currency')">
        <template #header-extra>
          <span class="material-symbols-outlined">currency_exchange</span>
        </template>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{{ t('settings.primaryCurrency') }}</span>
            <span class="setting-description">{{ t('settings.primaryCurrencyDesc') }}</span>
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
            <span class="setting-label">{{ t('settings.exchangeRates') }}</span>
            <span class="setting-description">{{ t('settings.exchangeRatesDesc') }}</span>
          </div>
          <div class="rates-info">
            <span class="rates-status" :class="{ loading: currencyStore.isLoadingRates }">
              <n-spin v-if="currencyStore.isLoadingRates" :size="14" />
              <span v-else class="material-symbols-outlined">check_circle</span>
              {{ currencyStore.isLoadingRates ? t('settings.updating') : t('settings.updated') }}
            </span>
            <button class="setting-btn" @click="currencyStore.fetchExchangeRates">
              <span class="material-symbols-outlined">refresh</span>
              {{ t('common.refresh') }}
            </button>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{{ t('settings.lastUpdated') }}</span>
            <span class="setting-description">{{ t('settings.lastUpdatedDesc') }}</span>
          </div>
          <span class="setting-value">{{ ratesLastUpdated }}</span>
        </div>
        <!-- 重新计算交易 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{{ t('settings.recalculateTransactions') }}</span>
            <span class="setting-description">{{ t('settings.recalculateDesc') }}</span>
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
              {{ currencyStore.isRecalculating ? t('settings.processing') : t('settings.recalculate') }}
            </button>
          </div>
        </div>
      </n-card>

      <!-- 通用设置 -->
      <n-card class="settings-card" :title="t('settings.general')">
        <template #header-extra>
          <span class="material-symbols-outlined">tune</span>
        </template>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{{ t('settings.language') }}</span>
            <span class="setting-description">{{ t('settings.languageDesc') }}</span>
          </div>
          <n-select
            :value="currentLocale"
            :options="languageOptions"
            style="width: 140px"
            @update:value="handleLocaleChange"
          />
        </div>
      </n-card>

      <!-- 数据管理 -->
      <n-card class="settings-card" :title="t('settings.data')">
        <template #header-extra>
          <span class="material-symbols-outlined">database</span>
        </template>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{{ t('settings.exportData') }}</span>
            <span class="setting-description">{{ t('settings.exportDesc') }}</span>
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
            <span class="setting-label">{{ t('settings.importData') }}</span>
            <span class="setting-description">{{ t('settings.importDesc') }}</span>
          </div>
          <button class="setting-btn" :disabled="isImporting" @click="triggerImport">
            <n-spin v-if="isImporting" :size="14" />
            <span v-else>{{ t('settings.import') }}</span>
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
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{{ t('settings.clearData') }}</span>
            <span class="setting-description">{{ t('settings.clearDataDesc') }}</span>
          </div>
          <button class="setting-btn danger" @click="handleClearAllData">
            {{ t('common.delete') }}
          </button>
        </div>
      </n-card>

      <!-- WebDAV 云同步 -->
      <n-card class="settings-card" :title="t('settings.cloudSync')">
        <template #header-extra>
          <span class="material-symbols-outlined">cloud_sync</span>
        </template>
        
        <!-- 服务商预设 -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{{ t('settings.serviceProvider') }}</span>
            <span class="setting-description">{{ t('settings.serviceProviderDesc') }}</span>
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
            <span class="setting-label">{{ t('settings.serverUrl') }}</span>
            <span class="setting-description">{{ t('settings.serverUrlDesc') }}</span>
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
            <span class="setting-label">{{ t('settings.username') }}</span>
            <span class="setting-description">{{ t('settings.usernameDesc') }}</span>
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
            <span class="setting-label">{{ t('settings.password') }}</span>
            <span class="setting-description">{{ t('settings.passwordDesc') }}</span>
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
            <span class="setting-label">{{ t('settings.remotePath') }}</span>
            <span class="setting-description">{{ t('settings.remotePathDesc') }}</span>
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
            <span class="setting-label">{{ t('settings.configuration') }}</span>
            <span class="setting-description">{{ t('settings.configurationDesc') }}</span>
          </div>
          <div class="export-buttons">
            <button class="setting-btn" :disabled="isTesting" @click="handleTestConnection">
              <n-spin v-if="isTesting" :size="14" />
              <span v-else>{{ t('settings.test') }}</span>
            </button>
            <button class="setting-btn" @click="handleSaveConfig">{{ t('common.save') }}</button>
            <button v-if="isConfigured" class="setting-btn danger" @click="handleClearConfig">{{ t('common.clear') }}</button>
          </div>
        </div>
        
        <!-- 同步操作 -->
        <div v-if="isConfigured" class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{{ t('settings.syncActions') }}</span>
            <span class="setting-description">
              {{ syncStatus.lastSyncTime ? `${t('settings.lastSync')}: ${new Date(syncStatus.lastSyncTime).toLocaleString()}` : t('settings.neverSynced') }}
            </span>
          </div>
          <div class="export-buttons">
            <button class="setting-btn primary" :disabled="isSyncing" @click="handleUpload">
              <n-spin v-if="isSyncing" :size="14" />
              <template v-else>
                <span class="material-symbols-outlined" style="font-size: 16px;">cloud_upload</span>
                {{ t('settings.upload') }}
              </template>
            </button>
            <button class="setting-btn" :disabled="isSyncing" @click="handleDownload">
              <n-spin v-if="isSyncing" :size="14" />
              <template v-else>
                <span class="material-symbols-outlined" style="font-size: 16px;">cloud_download</span>
                {{ t('settings.download') }}
              </template>
            </button>
          </div>
        </div>
      </n-card>

      <!-- 关于 -->
      <n-card class="settings-card" :title="t('settings.about')">
        <template #header-extra>
          <span class="material-symbols-outlined">info</span>
        </template>
        <div class="about-info">
          <div class="app-logo">
            <img src="@/assets/logo.svg" alt="Qingzhang" class="logo-img" />
            <div class="logo-text">
              <span class="app-name">{{ t('app.name') }}</span>
              <span class="app-version">{{ t('app.version') }} 1.0.0</span>
            </div>
          </div>
          <p class="app-description">
            {{ t('app.description') }}
          </p>
        </div>
      </n-card>
    </div>

    <!-- 备份选择弹窗 -->
    <n-modal
      v-model:show="showBackupModal"
      preset="card"
      :title="t('settings.selectBackup')"
      style="width: 500px; max-width: 90vw;"
      :mask-closable="!isSyncing"
    >
      <div class="backup-modal-content">
        <!-- 加载状态 -->
        <div v-if="isLoadingBackups" class="backup-loading">
          <n-spin size="medium" />
          <span>{{ t('settings.loadingBackups') }}</span>
        </div>
        
        <!-- 无备份 -->
        <div v-else-if="backupList.length === 0" class="backup-empty">
          <span class="material-symbols-outlined">cloud_off</span>
          <p>{{ t('settings.noBackups') }}</p>
        </div>
        
        <!-- 备份列表 -->
        <template v-else>
          <div class="backup-select-wrapper">
            <label class="backup-label">{{ t('settings.selectBackupLabel') }}:</label>
            <BackupSelect
              v-model="selectedBackup"
              :options="backupOptions"
              placeholder="Select a backup"
              @delete="handleDeleteBackup"
            />
          </div>
          
          <!-- 恢复模式 -->
          <div class="restore-mode-wrapper">
            <label class="backup-label">{{ t('settings.restoreMode') }}:</label>
            <n-radio-group v-model:value="restoreMode">
              <n-radio value="merge">
                <div class="mode-option">
                  <span class="mode-title">{{ t('settings.mergeMode') }}</span>
                  <span class="mode-desc">{{ t('settings.mergeModeDesc') }}</span>
                </div>
              </n-radio>
              <n-radio value="overwrite">
                <div class="mode-option">
                  <span class="mode-title">{{ t('settings.overwriteMode') }}</span>
                  <span class="mode-desc">{{ t('settings.overwriteModeDesc') }}</span>
                </div>
              </n-radio>
            </n-radio-group>
          </div>
          
          <!-- 操作按钮 -->
          <div class="backup-actions">
            <n-button @click="showBackupModal = false">{{ t('common.cancel') }}</n-button>
            <n-button 
              type="primary" 
              :loading="isSyncing" 
              :disabled="!selectedBackup"
              @click="handleRestore"
            >
              {{ t('settings.restore') }}
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
