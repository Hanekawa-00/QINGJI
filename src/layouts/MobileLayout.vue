<script setup lang="ts">
import { useAndroidBack, useSafeArea } from '@/hooks'

defineOptions({ name: 'MobileLayout' })

// 启用 Android 返回手势处理
useAndroidBack()

// 初始化安全区域（设置 CSS 变量）
useSafeArea()
</script>

<template>
  <div class="mobile-layout">
    <!-- 顶部安全区域占位 -->
    <div class="safe-area-top" />
    
    <!-- 主内容区 -->
    <main class="mobile-content">
      <router-view v-slot="{ Component }">
        <keep-alive :include="['MobileDashboard', 'MobileCalendar', 'MobileReports']">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>
    
    <!-- 底部安全区域占位 -->
    <div class="safe-area-bottom" />
  </div>
</template>

<style scoped>
.mobile-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  overflow: hidden;
}

/* 顶部安全区域（状态栏） */
.safe-area-top {
  height: var(--safe-area-inset-top, 0px);
  background: var(--color-background);
  flex-shrink: 0;
}

/* 主内容区 */
.mobile-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  /* 禁用弹性滚动 */
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.mobile-content::-webkit-scrollbar {
  display: none;
}

/* 底部安全区域（Home Indicator） */
.safe-area-bottom {
  height: var(--safe-area-inset-bottom, 0px);
  background: var(--color-background);
  flex-shrink: 0;
}
</style>
