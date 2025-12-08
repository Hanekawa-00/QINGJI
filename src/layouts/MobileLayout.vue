<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { platform } from '@tauri-apps/plugin-os'
import { useAndroidBack } from '@/hooks'

defineOptions({ name: 'MobileLayout' })

const isAndroid = ref(false)

// 启用 Android 返回手势处理
useAndroidBack()

onMounted(async () => {
  try {
    const os = await platform()
    isAndroid.value = os === 'android'
    
    // iOS 使用 CSS env() 自动适配
    // Android 使用原生 WindowInsets 处理，无需额外设置
  } catch (e) {
    // 非 Tauri 环境（浏览器）
    console.log('Platform detection failed, using defaults')
  }
})
</script>

<template>
  <div class="mobile-layout">
    <!-- 安全区域：顶部状态栏（仅 iOS 需要，Android 由原生处理） -->
    <div v-if="!isAndroid" class="safe-area-top" />
    
    <!-- 主内容区 -->
    <main class="mobile-content">
      <router-view v-slot="{ Component }">
        <keep-alive :include="['MobileDashboard', 'MobileCalendar', 'MobileReports']">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>
    
    <!-- 安全区域：底部（仅 iOS 需要） -->
    <div v-if="!isAndroid" class="safe-area-bottom" />
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

/* 顶部安全区域（状态栏）- 仅 iOS */
.safe-area-top {
  height: env(safe-area-inset-top, 0px);
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

/* 底部安全区域（Home Indicator）- 仅 iOS */
.safe-area-bottom {
  height: env(safe-area-inset-bottom, 0px);
  background: var(--color-background);
  flex-shrink: 0;
}
</style>
