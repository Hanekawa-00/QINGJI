<script setup lang="ts">
/**
 * 设置面板组件
 * 桌面端和移动端共用，通过 compact prop 控制布局
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NCard, NSpin, NProgress, NInput, NModal, NSelect, NRadioGroup, NRadio, NButton, useDialog, useMessage } from 'naive-ui'
import ThemeSwitcher from './ThemeSwitcher.vue'
import BackupSelect from './BackupSelect.vue'
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

interface Props {
  // 是否紧凑模式（移动端）
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  compact: false
})

const { t } = useI18n()
const currencyStore = useCurrencyStore()
const userStore = useUserStore()
const dialog = useDialog()
const message = useMessage()

// ==================== 语言设置 ====================
const currentLocale = ref<Locale>(getLocale())
const languageOptions = localeOptions.map(opt => ({
  label: opt.label,
  value: opt.value
}))

function handleLocaleChange(locale: Locale) {
  setLocale(locale)
  currentLocale.value = locale
}

// ==================== 币种设置 ====================
const currencyOptions = computed(() => 
  currencyStore.availableCurrencies.map(c => ({
    label: `${c.flag} ${c.code} - ${c.name}`,
    value: c.code
  }))
)

const previousCurrency = ref<CurrencyCode>(currencyStore.primaryCurrency)

const selectedCurrency = computed({
  get: () => currencyStore.primaryCurrency,
  set: (val: CurrencyCode) => handleCurrencyChange(val)
})

async function handleCurrencyChange(newCurrency: CurrencyCode) {
  const oldCurrency = previousCurrency.value
  if (newCurrency === oldCurrency) return
  
  await currencyStore.setPrimaryCurrency(newCurrency)
  
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

const ratesLastUpdated = computed(() => {
  if (!currencyStore.lastUpdated) return t('settings.notUpdated')
  return currencyStore.lastUpdated.toLocaleString()
})

// ==================== 数据导出/导入 ====================
const isExporting = ref(false)
const isImporting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

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
  } catch {
    message.error(t('messages.exportFailed'))
  } finally {
    isExporting.value = false
  }
}

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
  } catch {
    message.error(t('messages.exportFailed'))
  } finally {
    isExporting.value = false
  }
}

function triggerImport() {
  fileInputRef.value?.click()
}

async function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  isImporting.value = true
  try {
    const fileName = file.name.toLowerCase()
    if (fileName.endsWith('.csv')) {
      await handleCSVImport(file)
    } else if (fileName.endsWith('.json')) {
      await handleJSONImport(file)
    } else {
      message.error(t('messages.unsupportedFormat'))
    }
  } catch {
    message.error(t('messages.parseError'))
  } finally {
    isImporting.value = false
    target.value = ''
  }
}

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

async function handleCSVImport(file: File) {
  const result = await parseCSVImportFile(file)
  
  if (!result.success || result.transactions.length === 0) {
    const errorMsg = result.errors.length > 0 
      ? result.errors.slice(0, 3).join('; ') 
      : t('messages.noValidTransactions')
    message.error(t('messages.csvImportFailed', { error: errorMsg }))
    return
  }
  
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

async function doCSVImport(result: CSVImportResult) {
  let imported = 0
  let skipped = 0
  let failed = 0
  
  for (const txn of result.transactions) {
    try {
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
      
      let category = userStore.categories.find(
        c => c.name.toLowerCase() === txn.category.toLowerCase() && c.type === txn.type
      )
      
      if (!category) {
        category = userStore.categories.find(c => c.type === txn.type)
        if (!category) {
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
        currency: txn.currency as CurrencyCode,
        convertedAmount: txn.convertedAmount,
        exchangeRate: txn.exchangeRate,
        category: category?.name || 'Other',
        categoryIcon: category?.icon || 'receipt',
        description: txn.description,
        date: txn.date
      })
      imported++
    } catch {
      failed++
    }
  }
  
  let msg = t('messages.csvImportResult', { success: imported })
  if (skipped > 0) msg += ' ' + t('messages.csvDuplicatesSkipped', { count: skipped })
  if (failed > 0) msg += ' ' + t('messages.csvImportPartial', { failed })
  
  if (failed === 0) {
    message.success(msg)
  } else {
    message.warning(msg)
  }
}

async function doImport(data: ExportData, overwrite: boolean = false) {
  try {
    if (overwrite) {
      await userStore.clearAllData()
    }
    
    const result = await performImport(
      data,
      overwrite ? [] : userStore.categories,
      overwrite ? [] : userStore.transactions,
      userStore.addCategory,
      userStore.addTransaction
    )
    
    if (result.success) {
      if (data.settings?.primaryCurrency) {
        await currencyStore.setPrimaryCurrency(data.settings.primaryCurrency)
      }
      
      let msg = t('messages.importedResult', { 
        transactions: result.transactionsImported, 
        categories: result.categoriesImported 
      })
      if (result.transactionsSkipped > 0) {
        msg += ' ' + t('messages.importedWithSkip', { skipped: result.transactionsSkipped })
      }
      message.success(msg)
    } else {
      message.error(t('messages.importFailed') + ': ' + result.error)
    }
  } catch {
    message.error(t('messages.importFailed'))
  }
}

// ==================== 清除数据 ====================
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
      } catch {
        message.error(t('messages.deleteFailed'))
      }
    }
  })
}

// ==================== WebDAV 同步 ====================
const webdavConfig = ref<WebDAVConfig>({
  serverUrl: '',
  username: '',
  password: '',
  remotePath: '/QINGJI',
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

const showBackupModal = ref(false)
const backupList = ref<BackupFileInfo[]>([])
const selectedBackup = ref<string | null>(null)
const isLoadingBackups = ref(false)
const restoreMode = ref<'merge' | 'overwrite'>('merge')

// 移动端弹窗背景滚动锁定
function lockBodyScroll() {
  document.body.style.overflow = 'hidden'
  document.body.style.touchAction = 'none'
}

function unlockBodyScroll() {
  document.body.style.overflow = ''
  document.body.style.touchAction = ''
}

watch(showBackupModal, (visible) => {
  if (visible) {
    lockBodyScroll()
  } else {
    unlockBodyScroll()
  }
})

onBeforeUnmount(() => {
  unlockBodyScroll()
})

const presetOptions = [
  { label: t('settings.jianguoyun'), value: 'jianguoyun' },
  { label: 'Nextcloud', value: 'nextcloud' },
  { label: 'ownCloud', value: 'owncloud' },
  { label: t('settings.custom'), value: 'custom' }
]
const selectedPreset = ref('custom')

const backupOptions = computed(() => 
  backupList.value.map(b => ({
    label: b.displayName,
    value: b.filename
  }))
)

async function loadConfig() {
  const config = await loadWebDAVConfig()
  if (config) {
    webdavConfig.value = config
    isConfigured.value = true
    if (config.serverUrl.includes('jianguoyun')) {
      selectedPreset.value = 'jianguoyun'
    }
  }
  syncStatus.value = await loadSyncStatus()
}

function applyPreset(preset: string) {
  const presetConfig = WEBDAV_PRESETS[preset as keyof typeof WEBDAV_PRESETS]
  if (presetConfig) {
    webdavConfig.value.serverUrl = presetConfig.serverUrl
    webdavConfig.value.remotePath = presetConfig.defaultPath
  }
}

watch(selectedPreset, (preset) => {
  applyPreset(preset)
})

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
  } catch {
    message.error(t('messages.testFailed'))
  } finally {
    isTesting.value = false
  }
}

async function handleSaveConfig() {
  if (!webdavConfig.value.serverUrl || !webdavConfig.value.username) {
    message.warning(t('messages.fillRequired'))
    return
  }
  
  try {
    await saveWebDAVConfig(webdavConfig.value)
    isConfigured.value = true
    message.success(t('messages.configSaved'))
  } catch {
    message.error(t('messages.saveFailed'))
  }
}

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
        remotePath: '/QINGJI',
        autoSync: false,
        syncInterval: 30
      }
      isConfigured.value = false
      message.success(t('messages.configCleared'))
    }
  })
}

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
  } catch {
    message.error(t('messages.uploadFailed'))
  } finally {
    isSyncing.value = false
  }
}

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
  } catch {
    message.error(t('messages.loadBackupsFailed'))
  } finally {
    isLoadingBackups.value = false
  }
}

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
  } catch {
    message.error(t('messages.restoreFailed'))
  } finally {
    isSyncing.value = false
  }
}

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

// ==================== 初始化 ====================
onMounted(() => {
  currencyStore.initialize()
  previousCurrency.value = currencyStore.primaryCurrency
  loadConfig()
})

watch(() => currencyStore.isInitialized, (initialized) => {
  if (initialized) {
    previousCurrency.value = currencyStore.primaryCurrency
  }
})
</script>

<template>
  <div :class="['settings-panel', { compact }]">
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
          :style="{ width: compact ? '160px' : '220px' }"
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
          :style="{ width: compact ? '100%' : '280px' }"
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
          placeholder="/QINGJI"
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
          <img src="@/assets/logo.svg" alt="QINGJI" class="logo-img" />
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

    <!-- 备份选择弹窗 -->
    <n-modal
      v-model:show="showBackupModal"
      preset="card"
      :title="t('settings.selectBackup')"
      :style="{ width: compact ? '90vw' : '500px', maxWidth: '90vw' }"
      :mask-closable="!isSyncing"
      :block-scroll="true"
      to="body"
    >
      <div class="backup-modal-content">
        <div v-if="isLoadingBackups" class="backup-loading">
          <n-spin size="medium" />
          <span>{{ t('settings.loadingBackups') }}</span>
        </div>
        
        <div v-else-if="backupList.length === 0" class="backup-empty">
          <span class="material-symbols-outlined">cloud_off</span>
          <p>{{ t('settings.noBackups') }}</p>
        </div>
        
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
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 设置项 */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-strong);
}

.setting-description {
  font-size: 12px;
  color: var(--color-text-muted);
}

.setting-value {
  font-size: 14px;
  color: var(--color-text-muted);
}

/* 按钮组 */
.export-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.setting-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-strong);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.setting-btn:hover:not(:disabled) {
  background: var(--color-background);
}

.setting-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setting-btn.primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.setting-btn.danger {
  color: var(--color-error);
  border-color: var(--color-error);
}

.setting-btn .material-symbols-outlined {
  font-size: 16px;
}

/* 汇率状态 */
.rates-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rates-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-success);
}

.rates-status.loading {
  color: var(--color-text-muted);
}

.rates-status .material-symbols-outlined {
  font-size: 14px;
}

/* 重新计算 */
.recalculate-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 关于信息 */
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
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-strong);
}

.app-version {
  font-size: 12px;
  color: var(--color-text-muted);
}

.app-description {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
}

/* 备份弹窗 */
.backup-modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.backup-loading,
.backup-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px;
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
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-strong);
}

.mode-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mode-title {
  font-size: 14px;
  color: var(--color-text-strong);
}

.mode-desc {
  font-size: 12px;
  color: var(--color-text-muted);
}

.backup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
