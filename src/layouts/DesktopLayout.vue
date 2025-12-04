<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NLayout, NLayoutSider } from 'naive-ui'
import DesktopSidebar from '@/components/desktop/DesktopSidebar.vue'
import { ActionBar } from '@/components/common'

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
const siderWidth = 256
const collapsedWidth = 0

// 悬浮菜单状态
const fabMenuOpen = ref(false)

// 菜单项
const menuItems = [
  { key: '/desktop', icon: 'dashboard', label: 'Overview' },
  { key: '/desktop/calendar', icon: 'calendar_month', label: 'Calendar' },
  { key: '/desktop/reports', icon: 'list_alt', label: 'Reports' },
  { key: '/desktop/entry', icon: 'edit_square', label: 'New Entry' },
  { key: '/desktop/settings', icon: 'settings', label: 'Settings' }
]

// 当前路由
const activeKey = computed(() => route.path)

// 导航
function navigateTo(key: string) {
  router.push(key)
  fabMenuOpen.value = false
}

// 切换菜单
function toggleFabMenu() {
  fabMenuOpen.value = !fabMenuOpen.value
}
</script>

<template>
  <div class="desktop-wrapper">
    <!-- 窗口控制按钮（右上角） -->
    <ActionBar 
      class="window-controls-overlay"
      :show-pin="true"
      :draggable="false"
    />
    
    <n-layout has-sider position="absolute" class="desktop-layout">
      <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed="collapsed"
      :width="siderWidth"
      :collapsed-width="collapsedWidth"
      :native-scrollbar="false"
      show-trigger="bar"
      content-style="padding: 0;"
      position="absolute"
      class="desktop-sider"
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <DesktopSidebar v-show="!collapsed" />
    </n-layout-sider>
    
    <n-layout 
      :native-scrollbar="false"
      class="desktop-content"
      position="absolute"
      :style="{ left: collapsed ? '0' : `${siderWidth}px` }"
      content-style="display: flex; flex-direction: column; height: 100%;"
    >
      <!-- 顶部拖拽区域 -->
      <div class="drag-bar" data-tauri-drag-region></div>
      
      <div class="content-container">
        <router-view />
      </div>
    </n-layout>

    <!-- 悬浮导航按钮 (侧边栏折叠时显示) -->
    <Transition name="fab">
      <div v-if="collapsed" class="fab-container">
        <!-- 菜单项 -->
        <Transition name="fab-menu">
          <div v-if="fabMenuOpen" class="fab-menu">
            <button
              v-for="item in menuItems"
              :key="item.key"
              class="fab-menu-item"
              :class="{ active: activeKey === item.key }"
              :title="item.label"
              @click="navigateTo(item.key)"
            >
              <span class="material-symbols-outlined">{{ item.icon }}</span>
            </button>
          </div>
        </Transition>
        
        <!-- 主按钮 -->
        <button 
          class="fab-main" 
          :class="{ open: fabMenuOpen }"
          @click="toggleFabMenu"
        >
          <span class="material-symbols-outlined fab-icon">
            {{ fabMenuOpen ? 'close' : 'apps' }}
          </span>
        </button>
      </div>
    </Transition>
    </n-layout>
  </div>
</template>

<!-- 样式已提取到 @/styles/layouts/desktop.css -->
