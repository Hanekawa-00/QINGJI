<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user.store'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 菜单项
const menuItems = [
  { id: 'dashboard', label: 'Overview', icon: 'dashboard', path: '/desktop' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar_month', path: '/desktop/calendar' },
  { id: 'reports', label: 'Reports', icon: 'list_alt', path: '/desktop/reports' },
  { id: 'entry', label: 'New Entry', icon: 'edit_square', path: '/desktop/entry' }
]

// 当前激活的菜单项
const activeMenuItem = computed(() => {
  return menuItems.find(item => item.path === route.path)?.id || 'dashboard'
})

// 导航到指定页面
function navigateTo(path: string) {
  router.push(path)
}

// 格式化余额
const formattedBalance = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(userStore.totalBalance)
})
</script>

<template>
  <aside class="desktop-sidebar">
    <!-- Logo -->
    <div class="sidebar-header">
      <div class="logo-circle"></div>
      <div class="logo-text">
        <p class="app-name">Green Ledger</p>
        <p class="app-subtitle">Cross-platform</p>
      </div>
    </div>

    <!-- 导航菜单 -->
    <nav class="sidebar-nav">
      <button
        v-for="item in menuItems"
        :key="item.id"
        :class="['nav-item', { active: activeMenuItem === item.id }]"
        @click="navigateTo(item.path)"
      >
        <span class="material-symbols-outlined">{{ item.icon }}</span>
        {{ item.label }}
      </button>
    </nav>

    <!-- 余额卡片 -->
    <div class="balance-card">
      <p class="balance-label">Current Balance</p>
      <p class="balance-amount">{{ formattedBalance }}</p>
      <p class="balance-change">+5.2% vs last week</p>
    </div>
  </aside>
</template>

<style scoped src="@/styles/components/desktop-sidebar.css"></style>
