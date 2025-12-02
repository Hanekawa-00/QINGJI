<script setup lang="ts">
import { ref } from 'vue'
import { NLayout, NLayoutSider } from 'naive-ui'
import DesktopSidebar from '@/components/desktop/DesktopSidebar.vue'

const collapsed = ref(false)
const siderWidth = 256
const collapsedWidth = 0
</script>

<template>
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
    >
      <div class="content-container">
        <router-view />
      </div>
    </n-layout>
  </n-layout>
</template>

<style scoped>
.desktop-layout {
  min-height: 100vh;
  min-width: 800px;
  background: radial-gradient(circle at 15% 20%, #123125 0, rgba(18, 49, 37, 0) 28%),
              radial-gradient(circle at 80% 10%, #1b2d2a 0, rgba(27, 45, 42, 0) 30%),
              var(--color-background-dark);
}

.desktop-sider {
  background: rgba(17, 26, 22, 0.7) !important;
  border-right: 1px solid rgba(26, 43, 36, 0.8) !important;
}

.desktop-content {
  background: transparent !important;
  padding: 16px;
  min-width: 0;
  overflow-x: hidden;
  overscroll-behavior: none;
  transition: left 0.3s var(--n-bezier);
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

@media (min-width: 768px) {
  .desktop-content {
    padding: 32px;
  }
}

/* 超宽屏幕时增加左右边距 */
@media (min-width: 1800px) {
  .desktop-content {
    padding: 32px 48px;
  }
}
</style>
