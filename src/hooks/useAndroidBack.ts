import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useI18n } from 'vue-i18n'
import { showToast } from 'vant'
import 'vant/es/toast/style'

/**
 * Android 返回键/手势处理 Hook
 * 参考 HuLa 项目实现
 */
export function useAndroidBack() {
  const router = useRouter()
  const route = useRoute()
  const { t } = useI18n()
  
  let unlistenFn: UnlistenFn | null = null
  let lastBackPressAt = 0
  const backPressInterval = 2000
  
  // 主页面路由名称列表
  const mainRoutes = ['MobileDashboard', 'MobileCalendar', 'MobileReports', 'MobileSettings']

  const resolveEntryReturnRoute = () => {
    const from = route.query.from as string | undefined
    if (from && mainRoutes.includes(from)) {
      return { name: from }
    }
    return { name: 'MobileDashboard' as const }
  }
  
  // 处理返回逻辑
  const handleBack = async () => {
    const currentRouteName = route.name as string

    // 记账页返回时直接替换到来源主页面，避免历史栈残留导致回退穿透
    if (currentRouteName === 'MobileEntry') {
      await router.replace(resolveEntryReturnRoute())
      return
    }
    
    // 在主页面时遵循常见 App 习惯：非首页先回首页，首页双击退出
    if (mainRoutes.includes(currentRouteName)) {
      if (currentRouteName !== 'MobileDashboard') {
        await router.replace({ name: 'MobileDashboard' })
        return
      }

      const now = Date.now()
      if (now - lastBackPressAt < backPressInterval) {
        try {
          await getCurrentWindow().close()
        } catch (e) {
          console.warn('关闭应用失败:', e)
        }
        return
      }

      lastBackPressAt = now
      showToast(t('common.pressBackAgainToExit'))
      return
    }
    
    // 其他页面优先回退历史，若无历史则回首页
    if (window.history.length > 1) {
      router.back()
      return
    }

    await router.replace({ name: 'MobileDashboard' })
  }
  
  onMounted(async () => {
    // 检测是否为 Android 设备
    const isAndroid = /Android/i.test(navigator.userAgent)
    
    if (isAndroid) {
      try {
        // 监听 Tauri Android 返回事件
        unlistenFn = await listen('tauri://android-back', () => {
          void handleBack()
        })
      } catch (e) {
        console.warn('监听 Android 返回键失败:', e)
      }
    }
  })
  
  onUnmounted(() => {
    // 清理监听器
    if (unlistenFn) {
      unlistenFn()
      unlistenFn = null
    }
  })
  
  return {
    handleBack
  }
}
