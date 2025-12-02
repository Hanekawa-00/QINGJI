<script setup lang="ts">
/**
 * 主题切换组件
 * 跨平台通用（桌面端/移动端）
 */
import { useThemeStore } from '@/stores/theme.store'
import type { ThemeMode, ThemeName } from '@/types'

const themeStore = useThemeStore()

// 明暗模式选项
const modeOptions: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: '浅色', icon: 'light_mode' },
  { value: 'dark', label: '深色', icon: 'dark_mode' },
  { value: 'system', label: '跟随系统', icon: 'contrast' }
]

// 切换明暗模式
const handleModeChange = (mode: ThemeMode) => {
  themeStore.setMode(mode)
}

// 切换颜色主题
const handleThemeChange = (name: ThemeName) => {
  themeStore.setTheme(name)
}
</script>

<template>
  <div class="theme-switcher">
    <!-- 明暗模式切换 -->
    <div class="section">
      <div class="section-title">外观</div>
      <div class="mode-options">
        <button
          v-for="option in modeOptions"
          :key="option.value"
          :class="['mode-btn', { active: themeStore.mode === option.value }]"
          @click="handleModeChange(option.value)"
        >
          <span class="material-symbols-outlined">{{ option.icon }}</span>
          <span class="mode-label">{{ option.label }}</span>
        </button>
      </div>
    </div>

    <!-- 颜色主题选择 -->
    <div class="section">
      <div class="section-title">主题色</div>
      <div class="theme-options">
        <button
          v-for="theme in themeStore.availableThemes"
          :key="theme.name"
          :class="['theme-btn', { active: themeStore.themeName === theme.name }]"
          :style="{ '--theme-color': theme.primaryColor }"
          @click="handleThemeChange(theme.name)"
          :title="theme.label"
        >
          <span class="theme-color"></span>
          <span class="theme-check" v-if="themeStore.themeName === theme.name">
            <span class="material-symbols-outlined">check</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-switcher {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px 0;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 明暗模式按钮 */
.mode-options {
  display: flex;
  gap: 8px;
}

.mode-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-text-strong);
  background: rgba(var(--color-primary-rgb, 43, 215, 118), 0.05);
}

.mode-btn.active {
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb, 43, 215, 118), 0.15);
  color: var(--color-primary);
}

.mode-btn .material-symbols-outlined {
  font-size: 24px;
}

.mode-label {
  font-size: 0.75rem;
  font-weight: 500;
}

/* 颜色主题按钮 */
.theme-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.theme-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border: 2px solid transparent;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  padding: 3px;
  transition: all 0.2s ease;
}

.theme-btn:hover {
  transform: scale(1.1);
}

.theme-btn.active {
  border-color: var(--theme-color);
}

.theme-color {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--theme-color);
}

.theme-check {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  color: #fff;
}

.theme-check .material-symbols-outlined {
  font-size: 14px;
}
</style>
