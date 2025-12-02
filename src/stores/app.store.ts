/**
 * 应用级状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlatformType, OSType, PlatformInfo } from '@utils/platform'
import { detectPlatform, getOSType, getPlatformInfo } from '@utils/platform'

export const useAppStore = defineStore('app', () => {
  // 平台信息
  const platformType = ref<PlatformType>('desktop')
  const osType = ref<OSType>('unknown')
  const platformInfo = ref<PlatformInfo | null>(null)
  
  // 加载状态
  const isLoading = ref(false)
  const isInitialized = ref(false)

  /**
   * 初始化应用
   */
  async function initialize() {
    try {
      isLoading.value = true
      
      // 检测平台
      platformType.value = detectPlatform()
      osType.value = getOSType()
      platformInfo.value = await getPlatformInfo()
      
      isInitialized.value = true
    } catch (error) {
      console.error('Failed to initialize app:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 是否为桌面端
   */
  const isDesktop = computed(() => platformType.value === 'desktop')

  /**
   * 是否为移动端
   */
  const isMobile = computed(() => platformType.value === 'mobile')

  return {
    // 状态
    platformType,
    osType,
    platformInfo,
    isLoading,
    isInitialized,
    
    // 计算属性
    isDesktop,
    isMobile,
    
    // 方法
    initialize
  }
})
