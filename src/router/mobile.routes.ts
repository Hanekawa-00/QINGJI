/**
 * 移动端路由配置
 */
import type { RouteRecordRaw } from 'vue-router'

export const mobileRoutes: RouteRecordRaw[] = [
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
