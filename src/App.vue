<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { NConfigProvider, NGlobalStyle, NMessageProvider, NDialogProvider, NLoadingBarProvider, darkTheme } from 'naive-ui'
import { useAppStore } from '@/stores/app.store'
import { useThemeStore } from '@/stores/theme.store'
import { darkThemeOverrides, lightThemeOverrides } from '@/config/naive-ui-theme'

const appStore = useAppStore()
const themeStore = useThemeStore()

// 根据当前主题返回 NaiveUI 主题配置
const naiveTheme = computed(() => {
  return themeStore.activeTheme === 'dark' ? darkTheme : null
})

// 根据当前主题返回主题覆盖
const naiveThemeOverrides = computed(() => {
  return themeStore.activeTheme === 'dark' ? darkThemeOverrides : lightThemeOverrides
})

onMounted(async () => {
  // 初始化应用
  await appStore.initialize()
  
  // 初始化主题
  themeStore.initialize()
})
</script>

<template>
  <n-config-provider 
    :theme="naiveTheme" 
    :theme-overrides="naiveThemeOverrides"
  >
    <n-global-style />
    <n-loading-bar-provider>
      <n-message-provider>
        <n-dialog-provider>
          <div id="app" :data-theme="themeStore.activeTheme">
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