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
      },
      {
        path: 'settings',
        name: 'DesktopSettings',
        component: () => import('@/views/desktop/Settings.vue')
      }
    ]
  }
]

// 移动端路由
const mobileRoutes = [
  {
    path: '/mobile',
    component: () => import('@/layouts/MobileLayout.vue'),
    children: [
      {
        path: '',
        name: 'MobileDashboard',
        component: () => import('@/views/mobile/Dashboard.vue'),
        meta: { keepAlive: true }
      },
      {
        path: 'calendar',
        name: 'MobileCalendar',
        component: () => import('@/views/mobile/Calendar.vue'),
        meta: { keepAlive: true }
      },
      {
        path: 'entry',
        name: 'MobileEntry',
        component: () => import('@/views/mobile/Entry.vue'),
        meta: { keepAlive: false }
      },
      {
        path: 'reports',
        name: 'MobileReports',
        component: () => import('@/views/mobile/Reports.vue'),
        meta: { keepAlive: true }
      },
      {
        path: 'settings',
        name: 'MobileSettings',
        component: () => import('@/views/mobile/Settings.vue'),
        meta: { keepAlive: false }
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
