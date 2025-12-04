/**
 * i18n 国际化配置
 */
import { createI18n } from 'vue-i18n'
import en from './en'
import zhCN from './zh-CN'

export type Locale = 'en' | 'zh-CN'

// 从 localStorage 获取保存的语言设置
const getStoredLocale = (): Locale => {
  const stored = localStorage.getItem('app-locale')
  if (stored === 'en' || stored === 'zh-CN') {
    return stored
  }
  // 默认根据浏览器语言
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) {
    return 'zh-CN'
  }
  return 'en'
}

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: getStoredLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-CN': zhCN
  }
})

export default i18n

// 导出语言选项
export const localeOptions = [
  { label: 'English', value: 'en' as Locale },
  { label: '中文', value: 'zh-CN' as Locale }
]

// 切换语言
export const setLocale = (locale: Locale) => {
  i18n.global.locale.value = locale
  localStorage.setItem('app-locale', locale)
  document.documentElement.setAttribute('lang', locale)
}

// 获取当前语言
export const getLocale = (): Locale => {
  return i18n.global.locale.value as Locale
}
