/**
 * 路由配置
 * 支持桌面端和移动端平台感知路由
 */

import { createRouter, createWebHistory } from 'vue-router'
import { detectPlatform } from '@/utils/platform'

// 检测平台
const platform = detectPlatform()

// 桌面端路由
const desktopRoutes = [
  {
    path: '/desktop',
    component: () => import('@/layouts/DesktopLayout.vue'),
    children: [
      {
        path: '',
        name: 'DesktopDashboard',
        component: () => import('@/views/desktop/Dashboard.vue')
      },
      {
        path: 'calendar',
        name: 'DesktopCalendar',
        component: () => import('@/views/desktop/Calendar.vue')
      },
      {
        path: 'reports',
        name: 'DesktopReports',
        component: () => import('@/views/desktop/Reports.vue')
      },
      {
        path: 'entry',
        name: 'DesktopEntry',
        component: () => import('@/views/desktop/Entry.vue')
      }
    ]
  }
]

// 移动端路由（待实现）
const mobileRoutes = [
  {
    path: '/mobile',
    component: () => import('@/layouts/MobileLayout.vue'),
    children: [
      {
        path: '',
        name: 'MobileDashboard',
        component: () => import('@/views/mobile/Dashboard.vue')
      }
    ]
  }
]

// 根据平台选择路由
const routes = [
  {
    path: '/',
    redirect: platform === 'desktop' ? '/desktop' : '/mobile'
  },
  ...(platform === 'desktop' ? desktopRoutes : mobileRoutes)
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
