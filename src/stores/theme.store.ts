/**
 * 主题状态管理
 * 支持明暗模式 + 多种颜色主题
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ThemeMode, ThemeName, ThemeColors, ThemeConfig } from '@/types'

// 预设主题配置
const themePresets: Record<ThemeName, ThemeConfig> = {
  default: {
    name: 'default',
    label: 'Teal',
    colors: {
      dark: {
        primary: '#13987f',
        primaryHover: '#16b396',
        primaryPressed: '#0f7a65',
        background: '#ffffff',
        backgroundDark: '#141414',
        surface: '#1b1b1b',
        surfaceHover: '#262626',
        border: '#2a2a2a',
        textStrong: '#ffffff',
        textMuted: '#a1a1a1',
        income: '#16b396',
        expense: '#f472b6'
      },
      light: {
        primary: '#13987f',
        primaryHover: '#0f7a65',
        primaryPressed: '#0d6656',
        background: '#fafafa',
        backgroundDark: '#141414',
        surface: '#ffffff',
        surfaceHover: '#f5f5f5',
        border: '#e5e5e5',
        textStrong: '#18181c',
        textMuted: '#737373',
        income: '#13987f',
        expense: '#ec4899'
      }
    }
  },
  ocean: {
    name: 'ocean',
    label: 'Ocean',
    colors: {
      dark: {
        primary: '#0ea5e9',
        primaryHover: '#38bdf8',
        primaryPressed: '#0284c7',
        background: '#ffffff',
        backgroundDark: '#0f172a',
        surface: '#1e293b',
        surfaceHover: '#334155',
        border: '#334155',
        textStrong: '#f1f5f9',
        textMuted: '#94a3b8',
        income: '#38bdf8',
        expense: '#f472b6'
      },
      light: {
        primary: '#0ea5e9',
        primaryHover: '#0284c7',
        primaryPressed: '#0369a1',
        background: '#f8fafc',
        backgroundDark: '#0f172a',
        surface: '#ffffff',
        surfaceHover: '#f1f5f9',
        border: '#e2e8f0',
        textStrong: '#0f172a',
        textMuted: '#64748b',
        income: '#0ea5e9',
        expense: '#ec4899'
      }
    }
  },
  sunset: {
    name: 'sunset',
    label: 'Amber',
    colors: {
      dark: {
        primary: '#f59e0b',
        primaryHover: '#fbbf24',
        primaryPressed: '#d97706',
        background: '#ffffff',
        backgroundDark: '#18181b',
        surface: '#27272a',
        surfaceHover: '#3f3f46',
        border: '#3f3f46',
        textStrong: '#fafafa',
        textMuted: '#a1a1aa',
        income: '#fbbf24',
        expense: '#fb7185'
      },
      light: {
        primary: '#f59e0b',
        primaryHover: '#d97706',
        primaryPressed: '#b45309',
        background: '#fafafa',
        backgroundDark: '#18181b',
        surface: '#ffffff',
        surfaceHover: '#f4f4f5',
        border: '#e4e4e7',
        textStrong: '#18181b',
        textMuted: '#71717a',
        income: '#f59e0b',
        expense: '#ec4899'
      }
    }
  },
  rose: {
    name: 'rose',
    label: 'Rose',
    colors: {
      dark: {
        primary: '#f43f5e',
        primaryHover: '#fb7185',
        primaryPressed: '#e11d48',
        background: '#ffffff',
        backgroundDark: '#171717',
        surface: '#262626',
        surfaceHover: '#404040',
        border: '#404040',
        textStrong: '#fafafa',
        textMuted: '#a3a3a3',
        income: '#4ade80',
        expense: '#fb7185'
      },
      light: {
        primary: '#f43f5e',
        primaryHover: '#e11d48',
        primaryPressed: '#be123c',
        background: '#fafafa',
        backgroundDark: '#171717',
        surface: '#ffffff',
        surfaceHover: '#f5f5f5',
        border: '#e5e5e5',
        textStrong: '#171717',
        textMuted: '#737373',
        income: '#22c55e',
        expense: '#f43f5e'
      }
    }
  },
  lavender: {
    name: 'lavender',
    label: 'Violet',
    colors: {
      dark: {
        primary: '#8b5cf6',
        primaryHover: '#a78bfa',
        primaryPressed: '#7c3aed',
        background: '#ffffff',
        backgroundDark: '#18181b',
        surface: '#27272a',
        surfaceHover: '#3f3f46',
        border: '#3f3f46',
        textStrong: '#fafafa',
        textMuted: '#a1a1aa',
        income: '#a78bfa',
        expense: '#fb7185'
      },
      light: {
        primary: '#8b5cf6',
        primaryHover: '#7c3aed',
        primaryPressed: '#6d28d9',
        background: '#fafafa',
        backgroundDark: '#18181b',
        surface: '#ffffff',
        surfaceHover: '#f4f4f5',
        border: '#e4e4e7',
        textStrong: '#18181b',
        textMuted: '#71717a',
        income: '#8b5cf6',
        expense: '#ec4899'
      }
    }
  }
}

export const useThemeStore = defineStore('theme', () => {
  // 明暗模式
  const mode = ref<ThemeMode>('dark')
  
  // 当前选择的主题
  const themeName = ref<ThemeName>('default')
  
  // 实际应用的明暗模式
  const resolvedMode = ref<'light' | 'dark'>('dark')

  // 获取所有可用主题
  const availableThemes = computed(() => 
    Object.values(themePresets).map(t => ({
      name: t.name,
      label: t.label,
      primaryColor: t.colors.dark.primary
    }))
  )

  // 当前主题的颜色配置
  const currentColors = computed<ThemeColors>(() => {
    const preset = themePresets[themeName.value]
    return preset.colors[resolvedMode.value]
  })

  // 当前主题配置
  const currentTheme = computed(() => themePresets[themeName.value])

  /**
   * 设置明暗模式
   */
  function setMode(newMode: ThemeMode) {
    mode.value = newMode
    applyTheme()
    saveToStorage()
  }

  /**
   * 设置主题
   */
  function setTheme(name: ThemeName) {
    themeName.value = name
    applyTheme()
    saveToStorage()
  }

  /**
   * 切换明暗模式
   */
  function toggleMode() {
    const modes: ThemeMode[] = ['light', 'dark', 'system']
    const currentIndex = modes.indexOf(mode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    setMode(modes[nextIndex])
  }

  /**
   * 应用主题到 DOM
   */
  function applyTheme() {
    // 解析实际明暗模式
    let actualMode: 'light' | 'dark' = 'dark'
    if (mode.value === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      actualMode = prefersDark ? 'dark' : 'light'
    } else {
      actualMode = mode.value
    }
    resolvedMode.value = actualMode

    // 获取当前主题颜色
    const colors = themePresets[themeName.value].colors[actualMode]
    
    // 更新 CSS 变量
    const root = document.documentElement
    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-primary-hover', colors.primaryHover)
    root.style.setProperty('--color-primary-pressed', colors.primaryPressed)
    // 背景色：浅色模式用 background，深色模式用 backgroundDark
    root.style.setProperty('--color-background', actualMode === 'light' ? colors.background : colors.backgroundDark)
    root.style.setProperty('--color-background-dark', colors.backgroundDark)
    root.style.setProperty('--color-surface', colors.surface)
    root.style.setProperty('--color-surface-hover', colors.surfaceHover)
    root.style.setProperty('--color-border', colors.border)
    root.style.setProperty('--color-text-strong', colors.textStrong)
    root.style.setProperty('--color-text-muted', colors.textMuted)
    root.style.setProperty('--color-income', colors.income)
    root.style.setProperty('--color-expense', colors.expense)
    
    // 更新 data-theme 属性
    root.setAttribute('data-theme', actualMode)
    root.setAttribute('data-color-theme', themeName.value)
    root.classList.remove('light', 'dark')
    root.classList.add(actualMode)
  }

  /**
   * 保存到本地存储
   */
  function saveToStorage() {
    try {
      localStorage.setItem('theme-mode', mode.value)
      localStorage.setItem('theme-name', themeName.value)
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
      const savedTheme = localStorage.getItem('theme-name') as ThemeName | null
      
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        mode.value = savedMode
      }
      if (savedTheme && Object.keys(themePresets).includes(savedTheme)) {
        themeName.value = savedTheme
      }
    } catch (error) {
      console.warn('Failed to load theme from storage:', error)
    }
  }

  /**
   * 初始化主题系统
   */
  function initialize() {
    loadFromStorage()
    applyTheme()
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (mode.value === 'system') {
        applyTheme()
      }
    })
  }

  return {
    // 状态
    mode,
    themeName,
    resolvedMode,
    availableThemes,
    currentColors,
    currentTheme,
    
    // 方法
    setMode,
    setTheme,
    toggleMode,
    initialize
  }
})
