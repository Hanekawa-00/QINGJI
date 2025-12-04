<script setup lang="ts">
import { h, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NMenu, NCard, NStatistic } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { useUserStore } from '@/stores/user.store'
import { useCurrencyFormat } from '@/hooks'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { format: formatCurrency } = useCurrencyFormat()

// Material Icon 渲染函数
const renderIcon = (iconName: string) => {
  return () => h('span', { class: 'material-symbols-outlined menu-icon' }, iconName)
}

// NaiveUI 菜单选项
const menuOptions = computed<MenuOption[]>(() => [
  {
    label: t('nav.overview'),
    key: '/desktop',
    icon: renderIcon('dashboard')
  },
  {
    label: t('nav.calendar'),
    key: '/desktop/calendar',
    icon: renderIcon('calendar_month')
  },
  {
    label: t('nav.reports'),
    key: '/desktop/reports',
    icon: renderIcon('list_alt')
  },
  {
    label: t('nav.newEntry'),
    key: '/desktop/entry',
    icon: renderIcon('edit_square')
  },
  {
    label: t('nav.settings'),
    key: '/desktop/settings',
    icon: renderIcon('settings')
  }
])

// 当前激活的菜单项
const activeKey = computed(() => route.path)

// 菜单选择处理
const handleMenuSelect = (key: string) => {
  router.push(key)
}

// 格式化余额（使用主币种）
const formattedBalance = computed(() => {
  return formatCurrency(userStore.totalBalance)
})
</script>

<template>
  <aside class="desktop-sidebar">
    <!-- Logo + 可拖拽区域 -->
    <div class="sidebar-header" data-tauri-drag-region>
      <img src="@/assets/logo.svg" :alt="t('app.name')" class="logo-img" />
      <div class="logo-text">
        <p class="app-name">{{ t('app.name') }}</p>
        <p class="app-subtitle">{{ t('app.subtitle') }}</p>
      </div>
    </div>

    <!-- 导航菜单 -->
    <n-menu
      :value="activeKey"
      :options="menuOptions"
      :indent="16"
      class="sidebar-menu"
      @update:value="handleMenuSelect"
    />

    <!-- 余额卡片 -->
    <n-card class="balance-card" :bordered="true" size="small">
      <n-statistic :label="t('dashboard.currentBalance')" :value="formattedBalance" tabular-nums />
    </n-card>
  </aside>
</template>

<style scoped>
.desktop-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  height: 100%;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: grab;
  -webkit-app-region: drag;
  padding: 8px;
  margin: -8px;
  border-radius: 12px;
  transition: background 0.2s;
}

.sidebar-header:hover {
  background: color-mix(in srgb, var(--color-primary) 5%, transparent);
}

.logo-img {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.app-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-strong);
  margin: 0;
}

.app-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}

.sidebar-menu {
  flex: 1;
}

.sidebar-menu :deep(.n-menu-item-content) {
  border-radius: 8px;
  margin-bottom: 4px;
  border: 1px solid transparent;
}

.sidebar-menu :deep(.n-menu-item-content:not(.n-menu-item-content--selected):hover) {
  border-color: rgba(26, 43, 36, 0.6);
}

.sidebar-menu :deep(.n-menu-item-content--selected) {
  box-shadow: 0 20px 40px color-mix(in srgb, var(--color-primary) 35%, transparent);
}

.menu-icon {
  font-size: 18px;
}

.balance-card {
  margin-top: auto;
  background: var(--color-surface) !important;
  border-color: color-mix(in srgb, var(--color-primary) 20%, transparent) !important;
}

.balance-card :deep(.n-statistic-value) {
  font-size: 1.5rem !important;
  font-weight: 700;
}
</style>
