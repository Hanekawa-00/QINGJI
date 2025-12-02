/**
 * 主题状态管理
 */

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'

export const useThemeStore = defineStore('theme', () => {
  // 当前主题模式
  const mode = ref<ThemeMode>('dark')
  
  // 实际应用的主题（考虑 auto 模式）
  const activeTheme = ref<'light' | 'dark'>('dark')

  /**
   * 设置主题模式
   */
  function setMode(newMode: ThemeMode) {
    mode.value = newMode
    applyTheme()
    saveToStorage()
  }

  /**
   * 切换主题
   */
  function toggleTheme() {
    if (mode.value === 'light') {
      setMode('dark')
    } else if (mode.value === 'dark') {
      setMode('light')
    }
  }

  /**
   * 应用主题
   */
  function applyTheme() {
    let theme: 'light' | 'dark' = 'dark'
    
    if (mode.value === 'auto') {
      // 跟随系统
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme = prefersDark ? 'dark' : 'light'
    } else {
      theme = mode.value
    }
    
    activeTheme.value = theme
    
    // 更新 DOM
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  }

  /**
   * 保存到本地存储
   */
  function saveToStorage() {
    try {
      localStorage.setItem('theme-mode', mode.value)
    } catch (error) {
      console.warn('Failed to save theme to storage:', error)
    }
  }

  /**
   * 从本地存储加载
   */
  function loadFromStorage() {
    try {
      const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null
      if (savedMode && ['light', 'dark', 'auto'].includes(savedMode)) {
        mode.value = savedMode
      }
    } catch (error) {
      console.warn('Failed to load theme from storage:', error)
    }
  }

  /**
   * 初始化主题
   */
  function initialize() {
    loadFromStorage()
    applyTheme()
    
    // 监听系统主题变化（仅在 auto 模式下）
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (mode.value === 'auto') {
        applyTheme()
      }
    })
  }

  return {
    // 状态
    mode,
    activeTheme,
    
    // 方法
    setMode,
    toggleTheme,
    initialize
  }
})
