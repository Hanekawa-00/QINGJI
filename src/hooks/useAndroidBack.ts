import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

/**
 * Android 返回键/手势处理 Hook
 * 参考 HuLa 项目实现
 */
export function useAndroidBack() {
  const router = useRouter()
  const route = useRoute()
  
  let unlistenFn: UnlistenFn | null = null
  
  // 主页路由名称列表（在这些页面按返回键不执行 router.back）
  const mainRoutes = ['MobileDashboard', 'MobileCalendar', 'MobileReports', 'MobileSettings']
  
  // 处理返回逻辑
  const handleBack = () => {
    const currentRouteName = route.name as string
    
    // 如果在主页面，不处理返回（让系统处理退出）
    if (mainRoutes.includes(currentRouteName)) {
      // 可以在这里添加双击退出逻辑
      return
    }
    
    // 其他页面执行路由返回
    router.back()
  }
  
  onMounted(async () => {
    // 检测是否为 Android 设备
    const isAndroid = /Android/i.test(navigator.userAgent)
    
    if (isAndroid) {
      try {
        // 监听 Tauri Android 返回事件
        unlistenFn = await listen('tauri://android-back', () => {
          handleBack()
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
