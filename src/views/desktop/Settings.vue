<script setup lang="ts">
/**
 * 桌面端设置页面
 * 使用通用 SettingsPanel 组件
 */
import { useI18n } from 'vue-i18n'
import { SettingsPanel } from '@/components/common'

const { t } = useI18n()
</script>

<template>
  <div class="settings">
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">{{ t('settings.title') }}</h1>
        <p class="page-subtitle">{{ t('settings.subtitle') }}</p>
      </div>
    </header>

    <div class="settings-content">
      <SettingsPanel />
    </div>
  </div>
</template>

<!-- 样式已提取到 @/styles/views/settings.css -->
