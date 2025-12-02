<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app.store'
import { useThemeStore } from '@/stores/theme.store'

const appStore = useAppStore()
const themeStore = useThemeStore()

onMounted(async () => {
  // 初始化应用
  await appStore.initialize()
  
  // 初始化主题
  themeStore.initialize()
})
</script>

<template>
  <div id="app" :data-theme="themeStore.activeTheme">
    <router-view v-if="appStore.isInitialized" />
    <div v-else class="loading">
      <p>Loading...</p>
    </div>
  </div>
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