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
    label: 'Default Green',
    colors: {
      dark: {
        primary: '#2bd776',
        primaryHover: '#25c269',
        primaryPressed: '#1fad5c',
        background: '#ffffff',
        backgroundDark: '#0b1210',
        surface: '#111a16',
        surfaceHover: '#1a2b24',
        border: '#1a2b24',
        textStrong: '#e8f1ec',
        textMuted: '#7b8c82',
        income: '#4de6a5',
        expense: '#ef5f9a'
      },
      light: {
        primary: '#22c55e',
        primaryHover: '#16a34a',
        primaryPressed: '#15803d',
        background: '#f8faf9',
        backgroundDark: '#0b1210',
        surface: '#ffffff',
        surfaceHover: '#f0f5f3',
        border: '#d1e0da',
        textStrong: '#1a2b24',
        textMuted: '#6b7c74',
        income: '#22c55e',
        expense: '#ef4444'
      }
    }
  },
  ocean: {
    name: 'ocean',
    label: 'Ocean Blue',
    colors: {
      dark: {
        primary: '#38bdf8',
        primaryHover: '#0ea5e9',
        primaryPressed: '#0284c7',
        background: '#ffffff',
        backgroundDark: '#0c1222',
        surface: '#131b2e',
        surfaceHover: '#1e293b',
        border: '#1e3a5f',
        textStrong: '#e2e8f0',
        textMuted: '#94a3b8',
        income: '#38bdf8',
        expense: '#f472b6'
      },
      light: {
        primary: '#0ea5e9',
        primaryHover: '#0284c7',
        primaryPressed: '#0369a1',
        background: '#f0f9ff',
        backgroundDark: '#0c1222',
        surface: '#ffffff',
        surfaceHover: '#e0f2fe',
        border: '#bae6fd',
        textStrong: '#0c4a6e',
        textMuted: '#64748b',
        income: '#0ea5e9',
        expense: '#ef4444'
      }
    }
  },
  sunset: {
    name: 'sunset',
    label: 'Sunset Orange',
    colors: {
      dark: {
        primary: '#fb923c',
        primaryHover: '#f97316',
        primaryPressed: '#ea580c',
        background: '#ffffff',
        backgroundDark: '#18120b',
        surface: '#231a12',
        surfaceHover: '#2d2318',
        border: '#3d2f20',
        textStrong: '#fef3e2',
        textMuted: '#a89984',
        income: '#fbbf24',
        expense: '#f87171'
      },
      light: {
        primary: '#f97316',
        primaryHover: '#ea580c',
        primaryPressed: '#c2410c',
        background: '#fffbeb',
        backgroundDark: '#18120b',
        surface: '#ffffff',
        surfaceHover: '#fef3c7',
        border: '#fcd34d',
        textStrong: '#78350f',
        textMuted: '#92400e',
        income: '#f59e0b',
        expense: '#ef4444'
      }
    }
  },
  forest: {
    name: 'forest',
    label: 'Forest Green',
    colors: {
      dark: {
        primary: '#86efac',
        primaryHover: '#4ade80',
        primaryPressed: '#22c55e',
        background: '#ffffff',
        backgroundDark: '#071209',
        surface: '#0d1f12',
        surfaceHover: '#14291a',
        border: '#1a3d22',
        textStrong: '#dcfce7',
        textMuted: '#86a98f',
        income: '#86efac',
        expense: '#fca5a5'
      },
      light: {
        primary: '#22c55e',
        primaryHover: '#16a34a',
        primaryPressed: '#15803d',
        background: '#f0fdf4',
        backgroundDark: '#071209',
        surface: '#ffffff',
        surfaceHover: '#dcfce7',
        border: '#bbf7d0',
        textStrong: '#14532d',
        textMuted: '#166534',
        income: '#22c55e',
        expense: '#ef4444'
      }
    }
  },
  lavender: {
    name: 'lavender',
    label: 'Lavender Purple',
    colors: {
      dark: {
        primary: '#a78bfa',
        primaryHover: '#8b5cf6',
        primaryPressed: '#7c3aed',
        background: '#ffffff',
        backgroundDark: '#0f0b1a',
        surface: '#1a1425',
        surfaceHover: '#251d33',
        border: '#312541',
        textStrong: '#ede9fe',
        textMuted: '#a1a1aa',
        income: '#a78bfa',
        expense: '#fb7185'
      },
      light: {
        primary: '#8b5cf6',
        primaryHover: '#7c3aed',
        primaryPressed: '#6d28d9',
        background: '#faf5ff',
        backgroundDark: '#0f0b1a',
        surface: '#ffffff',
        surfaceHover: '#f3e8ff',
        border: '#e9d5ff',
        textStrong: '#3b0764',
        textMuted: '#6b21a8',
        income: '#8b5cf6',
        expense: '#ef4444'
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
