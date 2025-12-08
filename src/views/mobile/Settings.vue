<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { 
  Popup as VanPopup,
  Picker as VanPicker,
  ActionSheet as VanActionSheet,
  Loading as VanLoading,
  showConfirmDialog,
  showToast
} from 'vant'
import 'vant/es/popup/style'
import 'vant/es/picker/style'
import 'vant/es/action-sheet/style'
import 'vant/es/loading/style'
import 'vant/es/dialog/style'
import 'vant/es/toast/style'

import { useUserStore } from '@/stores/user.store'
import { useThemeStore } from '@/stores/theme.store'
import { useCurrencyStore } from '@/stores/currency.store'
import { localeOptions, setLocale, getLocale, type Locale } from '@/locales'
import type { CurrencyCode, ThemeMode } from '@/types'
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
  loadSyncStatus,
  WEBDAV_PRESETS,
  type WebDAVConfig,
  type SyncStatus,
  type BackupFileInfo
} from '@/services/webdav'

defineOptions({ name: 'MobileSettings' })

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const currencyStore = useCurrencyStore()

// 返回上一页
const goBack = () => router.back()

// 主题模式选项
const modeOptions = computed(() => [
  { value: 'light' as ThemeMode, label: t('settings.light'), icon: 'light_mode' },
  { value: 'dark' as ThemeMode, label: t('settings.dark'), icon: 'dark_mode' },
  { value: 'system' as ThemeMode, label: t('settings.system'), icon: 'contrast' }
])

// ==================== 语言设置 ====================
const showLanguagePicker = ref(false)
const currentLocale = ref<Locale>(getLocale())
const languageColumns = localeOptions.map(opt => ({ text: opt.label, value: opt.value }))

const currentLanguage = computed(() => {
  const opt = localeOptions.find(o => o.value === currentLocale.value)
  return opt?.label || 'English'
})

const onLanguageConfirm = ({ selectedOptions }: any) => {
  const selected = selectedOptions[0]?.value as Locale
  if (selected) {
    setLocale(selected)
    currentLocale.value = selected
    showToast(t('common.saved'))
  }
  showLanguagePicker.value = false
}

// ==================== 币种设置 ====================
const showCurrencyPicker = ref(false)
const previousCurrency = ref<CurrencyCode>(currencyStore.primaryCurrency)

const currencyColumns = computed(() => 
  currencyStore.availableCurrencies.map(c => ({
    text: `${c.flag} ${c.code} - ${c.name}`,
    value: c.code
  }))
)

const currentCurrency = computed(() => {
  const c = currencyStore.availableCurrencies.find(c => c.code === currencyStore.primaryCurrency)
  return c ? `${c.flag} ${c.code}` : currencyStore.primaryCurrency
})

const onCurrencyConfirm = async ({ selectedOptions }: any) => {
  const newCurrency = selectedOptions[0]?.value as CurrencyCode
  showCurrencyPicker.value = false
  
  if (!newCurrency || newCurrency === previousCurrency.value) return
  
  const oldCurrency = previousCurrency.value
  await currencyStore.setPrimaryCurrency(newCurrency)
  
  // 如果有交易记录，询问是否重新计算
  if (userStore.transactions.length > 0) {
    try {
      await showConfirmDialog({
        title: t('settings.recalculateDialog.title'),
        message: t('settings.recalculateDialog.content', { old: oldCurrency, new: newCurrency }),
        confirmButtonText: t('settings.recalculateDialog.confirm'),
        cancelButtonText: t('settings.recalculateDialog.skip')
      })
      await recalculateTransactions()
    } catch {
      showToast(t('settings.recalculateDialog.skipMessage'))
    }
  }
  
  previousCurrency.value = newCurrency
}

// 重新计算所有交易
const isRecalculating = ref(false)
async function recalculateTransactions() {
  isRecalculating.value = true
  try {
    const result = await currencyStore.recalculateAllTransactions(
      userStore.transactions,
      userStore.updateTransaction
    )
    
    if (result.failed === 0) {
      showToast(t('messages.recalculateSuccess', { count: result.success }))
    } else {
      showToast(t('messages.recalculateFailed', { success: result.success, failed: result.failed }))
    }
  } finally {
    isRecalculating.value = false
  }
}

// 刷新汇率
const isRefreshingRates = ref(false)
async function refreshExchangeRates() {
  isRefreshingRates.value = true
  try {
    await currencyStore.fetchExchangeRates()
    showToast(t('settings.updated'))
  } catch {
    showToast(t('messages.updateFailed'))
  } finally {
    isRefreshingRates.value = false
  }
}

// ==================== 数据导出/导入 ====================
const showExportSheet = ref(false)
const isExporting = ref(false)
const isImporting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const exportActions = computed(() => [
  { name: t('settings.exportJSON'), value: 'json' },
  { name: t('settings.exportCSV'), value: 'csv' }
])

// 导出操作
const onExportSelect = async (action: { value: string }) => {
  showExportSheet.value = false
  isExporting.value = true
  
  try {
    if (action.value === 'json') {
      const result = await exportAndDownload(
        userStore.transactions,
        userStore.categories,
        currencyStore.primaryCurrency
      )
      if (result.success) {
        showToast(t('messages.exportedTransactions', { 
          transactions: userStore.transactions.length, 
          categories: userStore.categories.length 
        }))
      } else if (result.error !== 'User cancelled') {
        showToast(t('messages.exportFailed'))
      }
    } else {
      const result = await exportCSVAndDownload(userStore.transactions)
      if (result.success) {
        showToast(t('messages.exportedToCSV', { count: userStore.transactions.length }))
      } else if (result.error !== 'User cancelled') {
        showToast(t('messages.exportFailed'))
      }
    }
  } catch {
    showToast(t('messages.exportFailed'))
  } finally {
    isExporting.value = false
  }
}

// 触发导入
const triggerImport = () => {
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
    
    if (fileName.endsWith('.csv')) {
      await handleCSVImport(file)
    } else if (fileName.endsWith('.json')) {
      await handleJSONImport(file)
    } else {
      showToast(t('messages.unsupportedFormat'))
    }
  } catch {
    showToast(t('messages.parseError'))
  } finally {
    isImporting.value = false
    target.value = ''
  }
}

// 处理 JSON 导入
async function handleJSONImport(file: File) {
  const result = await parseImportFile(file)
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to parse file')
  }
  
  const data = result.data
  const stats = getImportStats(data)
  
  try {
    await showConfirmDialog({
      title: t('settings.importJSONTitle'),
      message: t('messages.importPreview', { 
        transactions: stats.transactionsCount, 
        categories: stats.categoriesCount 
      }),
      confirmButtonText: t('settings.import'),
      cancelButtonText: t('common.cancel')
    })
    await doImport(data)
  } catch {
    // 用户取消
  }
}

// 处理 CSV 导入
async function handleCSVImport(file: File) {
  const result = await parseCSVImportFile(file)
  
  if (!result.success || result.transactions.length === 0) {
    showToast(t('messages.noValidTransactions'))
    return
  }
  
  try {
    await showConfirmDialog({
      title: t('settings.importCSVTitle'),
      message: t('messages.csvPreview', { count: result.transactions.length }),
      confirmButtonText: t('settings.import'),
      cancelButtonText: t('common.cancel')
    })
    await doCSVImport(result)
  } catch {
    // 用户取消
  }
}

// 执行 JSON 导入
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
      showToast(t('messages.importedResult', { 
        transactions: result.transactionsImported, 
        categories: result.categoriesImported 
      }))
    } else {
      showToast(t('messages.importFailed'))
    }
  } catch {
    showToast(t('messages.importFailed'))
  }
}

// 执行 CSV 导入
async function doCSVImport(result: CSVImportResult) {
  let imported = 0
  
  for (const txn of result.transactions) {
    try {
      // 去重检查
      const exists = userStore.transactions.find(t => 
        t.date === txn.date && t.amount === txn.amount && t.type === txn.type
      )
      if (exists) continue
      
      // 查找分类
      let category = userStore.categories.find(
        c => c.name.toLowerCase() === txn.category.toLowerCase() && c.type === txn.type
      )
      if (!category) {
        category = userStore.categories.find(c => c.type === txn.type)
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
    } catch {
      // 跳过失败的
    }
  }
  
  showToast(t('messages.csvImportResult', { success: imported }))
}

// ==================== 清除数据 ====================
const handleClearData = async () => {
  try {
    await showConfirmDialog({
      title: t('settings.clearDataTitle'),
      message: t('settings.clearDataMessage')
    })
    await userStore.clearAllData()
    showToast(t('common.deleted'))
  } catch {
    // 用户取消
  }
}

// ==================== WebDAV 同步 ====================
const showBackupPicker = ref(false)

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
const backupList = ref<BackupFileInfo[]>([])
const selectedBackup = ref<string | null>(null)
const isLoadingBackups = ref(false)

// 预设选项
const presetOptions = [
  { text: t('settings.jianguoyun'), value: 'jianguoyun' },
  { text: 'Nextcloud', value: 'nextcloud' },
  { text: 'ownCloud', value: 'owncloud' },
  { text: t('settings.custom'), value: 'custom' }
]
const selectedPreset = ref('custom')
const showPresetPicker = ref(false)

// 备份列表选项
const backupColumns = computed(() => 
  backupList.value.map(b => ({
    text: b.displayName,
    value: b.filename
  }))
)

// 加载 WebDAV 配置
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

// 应用预设
function onPresetConfirm({ selectedOptions }: any) {
  const preset = selectedOptions[0]?.value
  showPresetPicker.value = false
  
  if (preset) {
    selectedPreset.value = preset
    const presetConfig = WEBDAV_PRESETS[preset as keyof typeof WEBDAV_PRESETS]
    if (presetConfig) {
      webdavConfig.value.serverUrl = presetConfig.serverUrl
      webdavConfig.value.remotePath = presetConfig.defaultPath
    }
  }
}

// 测试连接
async function handleTestConnection() {
  if (!webdavConfig.value.serverUrl || !webdavConfig.value.username) {
    showToast(t('messages.fillServerAndUsername'))
    return
  }
  
  isTesting.value = true
  try {
    const result = await testConnection(webdavConfig.value)
    showToast(result.message)
  } catch {
    showToast(t('messages.testFailed'))
  } finally {
    isTesting.value = false
  }
}

// 保存配置
async function handleSaveConfig() {
  if (!webdavConfig.value.serverUrl || !webdavConfig.value.username) {
    showToast(t('messages.fillRequired'))
    return
  }
  
  try {
    await saveWebDAVConfig(webdavConfig.value)
    isConfigured.value = true
    showToast(t('messages.configSaved'))
  } catch {
    showToast(t('messages.saveFailed'))
  }
}

// 清除配置
async function handleClearWebdavConfig() {
  try {
    await showConfirmDialog({
      title: t('settings.clearConfig'),
      message: t('settings.clearConfigContent')
    })
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
    showToast(t('settings.configCleared'))
  } catch {
    // 用户取消
  }
}

// 上传到云端
async function handleUpload() {
  if (!isConfigured.value) {
    showToast(t('messages.configureWebDAVFirst'))
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
      showToast(t('messages.uploadSuccess'))
      syncStatus.value = await loadSyncStatus()
    } else {
      showToast(result.error || t('messages.uploadFailed'))
    }
  } catch {
    showToast(t('messages.uploadFailed'))
  } finally {
    isSyncing.value = false
  }
}

// 打开备份选择
async function handleDownload() {
  if (!isConfigured.value) {
    showToast(t('messages.configureWebDAVFirst'))
    return
  }
  
  isLoadingBackups.value = true
  showBackupPicker.value = true
  
  try {
    backupList.value = await listBackupFiles(webdavConfig.value)
    if (backupList.value.length > 0) {
      selectedBackup.value = backupList.value[0].filename
    } else {
      showToast(t('messages.noBackupsFound'))
      showBackupPicker.value = false
    }
  } catch {
    showToast(t('messages.loadBackupsFailed'))
    showBackupPicker.value = false
  } finally {
    isLoadingBackups.value = false
  }
}

// 确认恢复
async function onBackupConfirm({ selectedOptions }: any) {
  const filename = selectedOptions[0]?.value
  showBackupPicker.value = false
  
  if (!filename) return
  
  isSyncing.value = true
  try {
    const result = await downloadBackupFile(webdavConfig.value, filename)
    
    if (result.success && result.data) {
      await showConfirmDialog({
        title: t('settings.mergeDialog.title'),
        message: t('settings.mergeDialog.content', {
          transactions: result.data.transactions.length,
          categories: result.data.categories.length
        })
      })
      
      // 执行导入（合并模式）
      await doWebdavImport(result.data)
      syncStatus.value = await loadSyncStatus()
      showToast(t('messages.dataMerged'))
    } else {
      showToast(result.error || t('messages.downloadFailed'))
    }
  } catch {
    // 用户取消或失败
  } finally {
    isSyncing.value = false
  }
}

// WebDAV 导入数据
async function doWebdavImport(data: ExportData) {
  const result = await performImport(
    data,
    userStore.categories,
    userStore.transactions,
    userStore.addCategory,
    userStore.addTransaction
  )
  
  if (!result.success) {
    throw new Error('Import failed')
  }
}


// 版本信息
const appVersion = '1.0.0'

// 初始化
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
  <div class="mobile-settings">
    <!-- 顶部导航 -->
    <header class="settings-header">
      <button class="back-btn" @click="goBack">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <span class="header-title">{{ t('settings.title') }}</span>
      <div class="header-spacer" />
    </header>

    <div class="settings-content">
      <!-- 外观设置卡片 -->
      <section class="settings-card">
        <div class="card-header">
          <span class="material-symbols-outlined card-icon">palette</span>
          <span class="card-title">{{ t('settings.appearance') }}</span>
        </div>
        
        <!-- 明暗模式切换 -->
        <div class="mode-section">
          <span class="section-label">{{ t('settings.themeMode') }}</span>
          <div class="mode-options">
            <button
              v-for="mode in modeOptions"
              :key="mode.value"
              :class="['mode-btn', { active: themeStore.mode === mode.value }]"
              @click="themeStore.setMode(mode.value)"
            >
              <span class="material-symbols-outlined">{{ mode.icon }}</span>
              <span>{{ mode.label }}</span>
            </button>
          </div>
        </div>
        
        <!-- 颜色主题选择 -->
        <div class="theme-section">
          <span class="section-label">{{ t('settings.themeColor') }}</span>
          <div class="theme-options">
            <button
              v-for="theme in themeStore.availableThemes"
              :key="theme.name"
              :class="['theme-btn', { active: themeStore.themeName === theme.name }]"
              :style="{ '--theme-color': theme.primaryColor }"
              @click="themeStore.setTheme(theme.name)"
            >
              <span class="theme-color"></span>
              <span v-if="themeStore.themeName === theme.name" class="theme-check">
                <span class="material-symbols-outlined">check</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      <!-- 区域设置卡片 -->
      <section class="settings-card">
        <div class="card-header">
          <span class="material-symbols-outlined card-icon">language</span>
          <span class="card-title">{{ t('settings.regional') }}</span>
        </div>
        
        <div class="setting-item" @click="showLanguagePicker = true">
          <div class="item-info">
            <span class="item-label">{{ t('settings.language') }}</span>
          </div>
          <div class="item-action">
            <span class="item-value">{{ currentLanguage }}</span>
            <span class="material-symbols-outlined">chevron_right</span>
          </div>
        </div>
        
        <div class="setting-item" @click="showCurrencyPicker = true">
          <div class="item-info">
            <span class="item-label">{{ t('settings.currency') }}</span>
          </div>
          <div class="item-action">
            <span class="item-value">{{ currentCurrency }}</span>
            <span class="material-symbols-outlined">chevron_right</span>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="item-info">
            <span class="item-label">{{ t('settings.exchangeRates') }}</span>
          </div>
          <button class="action-btn" :disabled="isRefreshingRates" @click="refreshExchangeRates">
            <van-loading v-if="isRefreshingRates" size="14" />
            <template v-else>
              <span class="material-symbols-outlined">refresh</span>
              {{ t('common.refresh') }}
            </template>
          </button>
        </div>
      </section>

      <!-- 数据管理卡片 -->
      <section class="settings-card">
        <div class="card-header">
          <span class="material-symbols-outlined card-icon">database</span>
          <span class="card-title">{{ t('settings.dataManagement') }}</span>
        </div>
        
        <div class="setting-item" @click="showExportSheet = true">
          <div class="item-info">
            <span class="item-label">{{ t('settings.exportData') }}</span>
            <span class="item-desc">{{ t('settings.exportDesc') }}</span>
          </div>
          <div class="item-action">
            <van-loading v-if="isExporting" size="14" />
            <span v-else class="material-symbols-outlined">chevron_right</span>
          </div>
        </div>
        
        <div class="setting-item" @click="triggerImport">
          <div class="item-info">
            <span class="item-label">{{ t('settings.importData') }}</span>
            <span class="item-desc">{{ t('settings.importDesc') }}</span>
          </div>
          <div class="item-action">
            <van-loading v-if="isImporting" size="14" />
            <span v-else class="material-symbols-outlined">chevron_right</span>
          </div>
        </div>
        
        <div class="setting-item danger" @click="handleClearData">
          <div class="item-info">
            <span class="item-label">{{ t('settings.clearData') }}</span>
            <span class="item-desc">{{ t('settings.clearDataDesc') }}</span>
          </div>
          <span class="material-symbols-outlined">chevron_right</span>
        </div>
        
        <!-- 隐藏的文件输入 -->
        <input
          ref="fileInputRef"
          type="file"
          accept=".json,.csv"
          style="display: none"
          @change="handleFileImport"
        />
      </section>

      <!-- WebDAV 云同步卡片 -->
      <section class="settings-card">
        <div class="card-header">
          <span class="material-symbols-outlined card-icon">cloud_sync</span>
          <span class="card-title">{{ t('settings.cloudSync') }}</span>
        </div>
        
        <!-- 服务商预设 -->
        <div class="setting-item" @click="showPresetPicker = true">
          <div class="item-info">
            <span class="item-label">{{ t('settings.serviceProvider') }}</span>
          </div>
          <div class="item-action">
            <span class="item-value">{{ presetOptions.find(p => p.value === selectedPreset)?.text }}</span>
            <span class="material-symbols-outlined">chevron_right</span>
          </div>
        </div>
        
        <!-- 服务器地址 -->
        <div class="webdav-field">
          <label class="field-label">{{ t('settings.serverUrl') }}</label>
          <input 
            v-model="webdavConfig.serverUrl"
            class="text-input"
            placeholder="https://dav.example.com"
          />
        </div>
        
        <!-- 用户名 -->
        <div class="webdav-field">
          <label class="field-label">{{ t('settings.username') }}</label>
          <input 
            v-model="webdavConfig.username"
            class="text-input"
            :placeholder="t('settings.usernameDesc')"
          />
        </div>
        
        <!-- 密码 -->
        <div class="webdav-field">
          <label class="field-label">{{ t('settings.password') }}</label>
          <input 
            v-model="webdavConfig.password"
            type="password"
            class="text-input"
            :placeholder="t('settings.passwordDesc')"
          />
        </div>
        
        <!-- 远程路径 -->
        <div class="webdav-field">
          <label class="field-label">{{ t('settings.remotePath') }}</label>
          <input 
            v-model="webdavConfig.remotePath"
            class="text-input"
            placeholder="/Qingzhang"
          />
        </div>
        
        <!-- 配置操作 -->
        <div class="webdav-actions">
          <button class="webdav-btn" :disabled="isTesting" @click="handleTestConnection">
            <van-loading v-if="isTesting" size="14" />
            <span v-else>{{ t('settings.test') }}</span>
          </button>
          <button class="webdav-btn primary" @click="handleSaveConfig">
            {{ t('common.save') }}
          </button>
          <button v-if="isConfigured" class="webdav-btn danger" @click="handleClearWebdavConfig">
            {{ t('common.clear') }}
          </button>
        </div>
        
        <!-- 同步操作（已配置时显示） -->
        <template v-if="isConfigured">
          <div class="sync-divider"></div>
          
          <div class="setting-item">
            <div class="item-info">
              <span class="item-label">{{ t('settings.syncActions') }}</span>
              <span class="item-desc">
                {{ syncStatus.lastSyncTime 
                  ? `${t('settings.lastSync')}: ${new Date(syncStatus.lastSyncTime).toLocaleString()}` 
                  : t('settings.neverSynced') 
                }}
              </span>
            </div>
          </div>
          
          <div class="sync-buttons">
            <button class="sync-btn upload" :disabled="isSyncing" @click="handleUpload">
              <van-loading v-if="isSyncing" size="14" />
              <template v-else>
                <span class="material-symbols-outlined">cloud_upload</span>
                {{ t('settings.upload') }}
              </template>
            </button>
            <button class="sync-btn download" :disabled="isSyncing" @click="handleDownload">
              <van-loading v-if="isSyncing" size="14" />
              <template v-else>
                <span class="material-symbols-outlined">cloud_download</span>
                {{ t('settings.download') }}
              </template>
            </button>
          </div>
        </template>
      </section>

      <!-- 关于卡片 -->
      <section class="settings-card">
        <div class="card-header">
          <span class="material-symbols-outlined card-icon">info</span>
          <span class="card-title">{{ t('settings.about') }}</span>
        </div>
        
        <div class="setting-item">
          <div class="item-info">
            <span class="item-label">{{ t('settings.version') }}</span>
          </div>
          <span class="item-value">{{ appVersion }}</span>
        </div>
      </section>
    </div>
    
    <!-- 语言选择器 -->
    <van-popup v-model:show="showLanguagePicker" position="bottom" round>
      <van-picker
        :columns="languageColumns"
        @confirm="onLanguageConfirm"
        @cancel="showLanguagePicker = false"
      />
    </van-popup>
    
    <!-- 币种选择器 -->
    <van-popup v-model:show="showCurrencyPicker" position="bottom" round>
      <van-picker
        :columns="currencyColumns"
        @confirm="onCurrencyConfirm"
        @cancel="showCurrencyPicker = false"
      />
    </van-popup>
    
    <!-- 导出方式选择 -->
    <van-action-sheet
      v-model:show="showExportSheet"
      :actions="exportActions"
      :cancel-text="t('common.cancel')"
      @select="onExportSelect"
    />
    
    <!-- 预设选择器 -->
    <van-popup v-model:show="showPresetPicker" position="bottom" round>
      <van-picker
        :columns="presetOptions"
        @confirm="onPresetConfirm"
        @cancel="showPresetPicker = false"
      />
    </van-popup>
    
    <!-- 备份选择器 -->
    <van-popup v-model:show="showBackupPicker" position="bottom" round>
      <div v-if="isLoadingBackups" class="backup-loading">
        <van-loading size="24" />
        <span>{{ t('settings.loadingBackups') }}</span>
      </div>
      <van-picker
        v-else
        :columns="backupColumns"
        @confirm="onBackupConfirm"
        @cancel="showBackupPicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped>
.mobile-settings {
  min-height: 100%;
  background: var(--color-background);
}

/* 顶部导航 */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-background);
}

.back-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-btn .material-symbols-outlined {
  font-size: 18px;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-strong);
}

.header-spacer {
  width: 32px;
}

/* 内容区 */
.settings-content {
  padding: 0 12px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 设置卡片 */
.settings-card {
  background: var(--color-surface);
  border-radius: 16px;
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
}

.card-icon {
  font-size: 20px;
  color: var(--color-primary);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-strong);
}

/* 明暗模式切换 */
.mode-section,
.theme-section {
  padding: 14px 16px;
}

.mode-section {
  border-bottom: 1px solid var(--color-border);
}

.section-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.mode-options {
  display: flex;
  gap: 8px;
}

.mode-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn .material-symbols-outlined {
  font-size: 20px;
}

.mode-btn:active {
  transform: scale(0.98);
}

.mode-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-alpha-10);
  color: var(--color-primary);
}

/* 颜色主题选择 */
.theme-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.theme-btn {
  position: relative;
  width: 36px;
  height: 36px;
  border: 2px solid transparent;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  padding: 3px;
  transition: all 0.2s;
}

.theme-btn:active {
  transform: scale(0.95);
}

.theme-btn.active {
  border-color: var(--theme-color);
}

.theme-color {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--theme-color);
}

.theme-check {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  color: #fff;
}

.theme-check .material-symbols-outlined {
  font-size: 12px;
}

/* 设置项 */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:active {
  background: var(--color-surface-hover);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-strong);
}

.item-desc {
  font-size: 12px;
  color: var(--color-text-muted);
}

.item-action {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-muted);
}

.item-value {
  font-size: 13px;
  color: var(--color-text-muted);
}

.item-action .material-symbols-outlined {
  font-size: 18px;
}

/* 危险操作 */
.setting-item.danger .item-label {
  color: var(--color-error);
}

.setting-item.danger .material-symbols-outlined {
  color: var(--color-error);
}

/* 操作按钮 */
.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.action-btn .material-symbols-outlined {
  font-size: 16px;
}

.action-btn:disabled {
  opacity: 0.5;
}

/* WebDAV 内联配置 */
.webdav-field {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.webdav-field .field-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.text-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-strong);
  font-size: 14px;
  outline: none;
}

.text-input:focus {
  border-color: var(--color-primary);
}

.text-input::placeholder {
  color: var(--color-text-muted);
}

/* WebDAV 操作按钮 */
.webdav-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.webdav-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-strong);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.webdav-btn.primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.webdav-btn.danger {
  background: transparent;
  border-color: var(--color-error);
  color: var(--color-error);
}

.webdav-btn:disabled {
  opacity: 0.5;
}

/* 同步分隔线 */
.sync-divider {
  height: 8px;
  background: var(--color-background);
}

/* 同步按钮 */
.sync-buttons {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
}

.sync-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.sync-btn .material-symbols-outlined {
  font-size: 18px;
}

.sync-btn.upload {
  background: var(--color-primary);
  color: white;
}

.sync-btn.download {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-strong);
}

.sync-btn:disabled {
  opacity: 0.5;
}

/* 备份加载状态 */
.backup-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
  color: var(--color-text-muted);
}
</style>
