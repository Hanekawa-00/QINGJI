<script setup lang="ts">
import { computed } from 'vue'
import { ConfigProvider as VanConfigProvider } from 'vant'
import 'vant/es/config-provider/style'
import { useAndroidBack, useSafeArea } from '@/hooks'
import { useThemeStore } from '@/stores/theme.store'

defineOptions({ name: 'MobileLayout' })

// 启用 Android 返回手势处理
useAndroidBack()

// 初始化安全区域（设置 CSS 变量）
useSafeArea()

// Vant 主题
const themeStore = useThemeStore()
const vantTheme = computed(() => themeStore.resolvedMode === 'dark' ? 'dark' : 'light')
</script>

<template>
  <van-config-provider :theme="vantTheme">
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
  </van-config-provider>
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
  /* 左右安全区域内边距 */
  padding-left: var(--safe-area-inset-left, 0px);
  padding-right: var(--safe-area-inset-right, 0px);
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
