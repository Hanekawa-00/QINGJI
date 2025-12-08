/**
 * 安全区域 Hook
 * 获取移动端安全区域信息（状态栏、导航栏等）
 * 参考 HuLa 项目实现
 */

import { ref, onMounted, readonly } from 'vue'
import { platform } from '@tauri-apps/plugin-os'

export interface SafeAreaInsets {
  top: number
  bottom: number
  left: number
  right: number
}

// 全局安全区域状态（单例）
const safeArea = ref<SafeAreaInsets>({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0
})

// 是否已初始化
const initialized = ref(false)

/**
 * 初始化安全区域
 * 在移动端使用插件获取，桌面端使用默认值
 */
async function initSafeArea(): Promise<void> {
  if (initialized.value) return

  try {
    const currentPlatform = await platform()
    
    // 仅在移动端获取安全区域
    if (currentPlatform === 'android' || currentPlatform === 'ios') {
      // 动态导入插件（避免桌面端报错）
      const { getInsets } = await import('tauri-plugin-safe-area-insets')
      const insets = await getInsets()
      
      safeArea.value = {
        top: insets.top || 0,
        bottom: insets.bottom || 0,
        left: insets.left || 0,
        right: insets.right || 0
      }
      
      // 更新 CSS 变量
      updateCssVariables(safeArea.value)
      
      console.log('[SafeArea] Initialized:', safeArea.value)
    }
  } catch (error) {
    console.warn('[SafeArea] Failed to get insets, using defaults:', error)
  }
  
  initialized.value = true
}

/**
 * 更新 CSS 变量
 */
function updateCssVariables(insets: SafeAreaInsets): void {
  const root = document.documentElement
  root.style.setProperty('--safe-area-inset-top', `${insets.top}px`)
  root.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`)
  root.style.setProperty('--safe-area-inset-left', `${insets.left}px`)
  root.style.setProperty('--safe-area-inset-right', `${insets.right}px`)
}

/**
 * 安全区域 Composable
 */
export function useSafeArea() {
  onMounted(() => {
    initSafeArea()
  })

  return {
    /** 安全区域尺寸（只读） */
    safeArea: readonly(safeArea),
    /** 是否已初始化 */
    initialized: readonly(initialized),
    /** 手动刷新安全区域 */
    refresh: async () => {
      initialized.value = false
      await initSafeArea()
    }
  }
}

/**
 * 在应用启动时初始化安全区域
 * 应在 main.ts 中调用
 */
export async function setupSafeArea(): Promise<void> {
  await initSafeArea()
}

export default useSafeArea
