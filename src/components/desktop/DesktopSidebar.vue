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

<!-- 样式已提取到 @/styles/components/sidebar.css -->
