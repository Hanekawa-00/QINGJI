package com.zzh.qingzhang

import android.graphics.Color
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat

/**
 * MainActivity - 启用边到边模式
 * 安全区域由 tauri-plugin-safe-area-insets 插件在前端处理
 */
class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    
    // 状态栏和导航栏透明
    window.statusBarColor = Color.TRANSPARENT
    window.navigationBarColor = Color.TRANSPARENT
    
    // 允许内容延伸到系统栏区域（安全区域由前端 CSS 处理）
    WindowCompat.setDecorFitsSystemWindows(window, false)
  }
}
