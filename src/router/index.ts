/**
 * 路由配置
 * 支持桌面端和移动端平台感知路由
 * 构建时通过 Vite 插件排除另一端的代码
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { detectPlatform } from '@/utils/platform'

// 导入平台路由（构建时会被 Vite 插件处理，排除另一端）
import { desktopRoutes } from './desktop.routes'
import { mobileRoutes } from './mobile.routes'

// 检测平台
const platform = detectPlatform()
const isDesktop = platform === 'desktop'

// 根据平台选择路由
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: isDesktop ? '/desktop' : '/mobile'
  },
  ...(isDesktop ? desktopRoutes : mobileRoutes)
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
