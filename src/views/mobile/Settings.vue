<script setup lang="ts">
/**
 * 移动端设置页面
 * 使用通用 SettingsPanel 组件（紧凑模式）
 */
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { SettingsPanel } from '@/components/common'

defineOptions({ name: 'MobileSettings' })

const { t } = useI18n()
const router = useRouter()

function goBack() {
  router.back()
}
</script>

<template>
  <div class="mobile-settings">
    <!-- 顶部导航 -->
    <header class="settings-header">
      <button class="back-btn" @click="goBack">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <span class="header-title">{{ t('settings.title') }}</span>
      <div class="header-spacer" />
    </header>

    <!-- 设置面板 -->
    <div class="m-settings-content">
      <SettingsPanel compact />
    </div>
  </div>
</template>

<style scoped>
.mobile-settings {
  min-height: 100%;
  background: var(--color-background);
}

/* 顶部导航 */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-background);
}

.back-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-btn .material-symbols-outlined {
  font-size: 18px;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-strong);
}

.header-spacer {
  width: 32px;
}

/* 内容区 */
.m-settings-content {
  padding: 0 16px 24px;
}

/* ===== 移动端 NaiveUI 组件样式覆盖 ===== */
/* 设置面板间距 */
.m-settings-content :deep(.settings-panel) {
  gap: 12px;
}

/* 卡片样式 */
.m-settings-content :deep(.n-card) {
  overflow: hidden;
  border-radius: 12px;
}

.m-settings-content :deep(.n-card__content) {
  padding: 12px !important;
}

/* 设置项布局 */
.m-settings-content :deep(.setting-item) {
  flex-wrap: wrap;
  gap: 8px;
}

.m-settings-content :deep(.setting-info) {
  flex: 1;
  min-width: 0;
}

.m-settings-content :deep(.setting-description) {
  word-break: break-word;
}

/* 输入框和选择器宽度 */
.m-settings-content :deep(.n-input),
.m-settings-content :deep(.n-select) {
  max-width: 140px !important;
  flex-shrink: 0;
}

/* 按钮组 */
.m-settings-content :deep(.export-buttons) {
  flex-shrink: 0;
}
</style>
