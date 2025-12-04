<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NConfigProvider, NGlobalStyle, NMessageProvider, NDialogProvider, NLoadingBarProvider, darkTheme, zhCN, dateZhCN, enUS, dateEnUS } from 'naive-ui'
import { useAppStore } from '@/stores/app.store'
import { useThemeStore } from '@/stores/theme.store'
import { useUserStore } from '@/stores/user.store'
import { useCurrencyStore } from '@/stores/currency.store'
import { createDarkThemeOverrides, createLightThemeOverrides } from '@/config/naive-ui-theme'
import { getCurrentWindow } from '@tauri-apps/api/window'

const { locale } = useI18n()
const appStore = useAppStore()
const themeStore = useThemeStore()
const userStore = useUserStore()
const currencyStore = useCurrencyStore()

// 根据当前主题返回 NaiveUI 主题配置
const naiveTheme = computed(() => {
  return themeStore.resolvedMode === 'dark' ? darkTheme : null
})

// 根据当前主题颜色动态生成主题覆盖
const naiveThemeOverrides = computed(() => {
  const colors = themeStore.currentColors
  return themeStore.resolvedMode === 'dark' 
    ? createDarkThemeOverrides(colors) 
    : createLightThemeOverrides(colors)
})

// NaiveUI 语言配置
const naiveLocale = computed(() => locale.value === 'zh-CN' ? zhCN : enUS)
const naiveDateLocale = computed(() => locale.value === 'zh-CN' ? dateZhCN : dateEnUS)

// 禁用浏览器默认右键菜单
const preventContextMenu = (e: MouseEvent) => {
  e.preventDefault()
}

onMounted(async () => {
  // 禁用右键菜单
  document.addEventListener('contextmenu', preventContextMenu)
  
  // 强制移除窗口装饰（确保自定义标题栏生效）
  try {
    const appWindow = getCurrentWindow()
    await appWindow.setDecorations(false)
  } catch (e) {
    console.warn('Failed to set decorations:', e)
  }
  
  // 初始化应用
  await appStore.initialize()
  
  // 初始化主题
  themeStore.initialize()
  
  // 初始化数据库并加载用户数据
  await userStore.initialize()
  
  // 初始化币种设置和汇率
  await currencyStore.initialize()
})

onUnmounted(() => {
  // 清理事件监听
  document.removeEventListener('contextmenu', preventContextMenu)
})
</script>

<template>
  <n-config-provider 
    :theme="naiveTheme" 
    :theme-overrides="naiveThemeOverrides"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
  >
    <n-global-style />
    <n-loading-bar-provider>
      <n-message-provider>
        <n-dialog-provider>
          <div id="app" :data-theme="themeStore.resolvedMode">
            <router-view v-if="appStore.isInitialized" />
            <div v-else class="loading">
              <p>Loading...</p>
            </div>
          </div>
        </n-dialog-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<style>
#app {
  min-height: 100vh;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-size: var(--font-size-lg);
  color: var(--color-text-muted);
}
</style>