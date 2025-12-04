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

<style scoped>
.desktop-wrapper {
  position: relative;
  height: 100vh;
  min-width: 800px;
  background: radial-gradient(circle at 15% 20%, color-mix(in srgb, var(--color-primary) 15%, var(--color-background)) 0, transparent 28%),
              radial-gradient(circle at 80% 10%, color-mix(in srgb, var(--color-primary) 10%, var(--color-background)) 0, transparent 30%),
              var(--color-background);
}

/* 窗口控制按钮覆盖层 */
.window-controls-overlay {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9999;
  background: transparent;
}

.desktop-layout {
  height: 100%;
  position: relative !important;
}

/* 顶部拖拽条 */
.drag-bar {
  height: 28px;
  width: 100%;
  -webkit-app-region: drag;
  cursor: grab;
  flex-shrink: 0;
}

.desktop-sider {
  background: color-mix(in srgb, var(--color-surface) 70%, transparent) !important;
  border-right: 1px solid color-mix(in srgb, var(--color-border) 80%, transparent) !important;
}

.desktop-content {
  background: transparent !important;
  padding: 0 16px 16px 16px;
  min-width: 0;
  overflow-x: hidden;
  overscroll-behavior: none;
  transition: left 0.3s var(--n-bezier);
}

.content-container {
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  overflow-y: auto;
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--color-text-muted) 30%, transparent) transparent;
}

.content-container::-webkit-scrollbar {
  width: 6px;
}

.content-container::-webkit-scrollbar-track {
  background: transparent;
}

.content-container::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--color-text-muted) 30%, transparent);
  border-radius: 3px;
}

.content-container::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--color-text-muted) 50%, transparent);
}

@media (min-width: 768px) {
  .desktop-content {
    padding: 0 32px 32px 32px;
  }
}

/* 超宽屏幕时增加左右边距 */
@media (min-width: 1800px) {
  .desktop-content {
    padding: 0 48px 32px 48px;
  }
}

/* ==================== 悬浮导航按钮 ==================== */
.fab-container {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 1000;
}

.fab-main {
  position: relative;
  z-index: 2;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(43, 215, 118, 0.4);
  transition: all 0.3s ease;
}

.fab-main:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 24px rgba(43, 215, 118, 0.5);
}

.fab-main.open {
  background: var(--color-surface);
  color: var(--color-text-strong);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.fab-icon {
  font-size: 24px;
  transition: transform 0.3s ease;
}

.fab-main.open .fab-icon {
  transform: rotate(90deg);
}

.fab-menu {
  position: absolute;
  bottom: 68px;
  left: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fab-menu-item {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.fab-menu-item:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: scale(1.1);
}

.fab-menu-item.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(43, 215, 118, 0.3);
}

.fab-menu-item .material-symbols-outlined {
  font-size: 22px;
}

/* FAB 动画 */
.fab-enter-active,
.fab-leave-active {
  transition: all 0.3s ease;
}

.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

/* FAB 菜单动画 */
.fab-menu-enter-active,
.fab-menu-leave-active {
  transition: all 0.3s ease;
}

.fab-menu-enter-from,
.fab-menu-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 菜单项依次出现动画 */
.fab-menu-item {
  animation: fab-item-pop 0.3s ease backwards;
}

.fab-menu-item:nth-child(1) { animation-delay: 0ms; }
.fab-menu-item:nth-child(2) { animation-delay: 50ms; }
.fab-menu-item:nth-child(3) { animation-delay: 100ms; }
.fab-menu-item:nth-child(4) { animation-delay: 150ms; }
.fab-menu-item:nth-child(5) { animation-delay: 200ms; }

@keyframes fab-item-pop {
  from {
    opacity: 0;
    transform: scale(0.5) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
