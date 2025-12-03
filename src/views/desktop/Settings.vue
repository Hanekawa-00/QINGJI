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
  
  if (result.failed === 0) {
    message.success(`Successfully recalculated ${result.success} transactions`)
  } else {
    message.warning(`Recalculated ${result.success} transactions, ${result.failed} failed`)
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
          <button class="setting-btn">Export</button>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Import Data</span>
            <span class="setting-description">Import from CSV or other formats</span>
          </div>
          <button class="setting-btn">Import</button>
        </div>
      </n-card>

      <!-- 关于 -->
      <n-card class="settings-card" title="About">
        <template #header-extra>
          <span class="material-symbols-outlined">info</span>
        </template>
        <div class="about-info">
          <div class="app-logo">
            <div class="logo-circle"></div>
            <div class="logo-text">
              <span class="app-name">Green Ledger</span>
              <span class="app-version">Version 1.0.0</span>
            </div>
          </div>
          <p class="app-description">
            A cross-platform personal finance management app built with Vue 3 and Tauri.
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

.logo-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 50%, transparent);
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
