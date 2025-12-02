<script setup lang="ts">
/**
 * 设置页面
 * 包含主题设置、应用配置等
 */
import { NCard } from 'naive-ui'
import { ThemeSwitcher } from '@/components/common'
</script>

<template>
  <div class="settings">
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Customize your app experience</p>
      </div>
    </header>

    <div class="settings-content">
      <!-- 外观设置 -->
      <n-card class="settings-card" title="Appearance">
        <template #header-extra>
          <span class="material-symbols-outlined">palette</span>
        </template>
        <ThemeSwitcher />
      </n-card>

      <!-- 通用设置 -->
      <n-card class="settings-card" title="General">
        <template #header-extra>
          <span class="material-symbols-outlined">tune</span>
        </template>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Currency</span>
            <span class="setting-description">Default currency for transactions</span>
          </div>
          <span class="setting-value">USD ($)</span>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Language</span>
            <span class="setting-description">App display language</span>
          </div>
          <span class="setting-value">English</span>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Date Format</span>
            <span class="setting-description">How dates are displayed</span>
          </div>
          <span class="setting-value">YYYY-MM-DD</span>
        </div>
      </n-card>

      <!-- 数据管理 -->
      <n-card class="settings-card" title="Data">
        <template #header-extra>
          <span class="material-symbols-outlined">database</span>
        </template>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Export Data</span>
            <span class="setting-description">Download your transaction history</span>
          </div>
          <button class="setting-btn">Export</button>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Import Data</span>
            <span class="setting-description">Import from CSV or other formats</span>
          </div>
          <button class="setting-btn">Import</button>
        </div>
      </n-card>

      <!-- 关于 -->
      <n-card class="settings-card" title="About">
        <template #header-extra>
          <span class="material-symbols-outlined">info</span>
        </template>
        <div class="about-info">
          <div class="app-logo">
            <div class="logo-circle"></div>
            <div class="logo-text">
              <span class="app-name">Green Ledger</span>
              <span class="app-version">Version 1.0.0</span>
            </div>
          </div>
          <p class="app-description">
            A cross-platform personal finance management app built with Vue 3 and Tauri.
          </p>
        </div>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.settings {
  padding: 8px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-strong);
  margin: 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 4px 0 0 0;
}

.settings-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.settings-card {
  background: var(--color-surface) !important;
  border-color: color-mix(in srgb, var(--color-primary) 20%, transparent) !important;
}

.settings-card :deep(.n-card-header) {
  padding-bottom: 12px;
}

.settings-card :deep(.n-card-header__main) {
  font-weight: 600;
  font-size: 1rem;
}

.settings-card :deep(.n-card-header__extra) {
  color: var(--color-primary);
}

/* 设置项 */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-border);
}

.setting-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-item:first-child {
  padding-top: 0;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-weight: 500;
  color: var(--color-text-strong);
}

.setting-description {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.setting-value {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.setting-btn {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-strong);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.setting-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* 关于区域 */
.about-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 50%, transparent);
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.app-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-strong);
}

.app-version {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.app-description {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
}
</style>
