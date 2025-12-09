/**
 * 桌面端路由配置
 */
import type { RouteRecordRaw } from 'vue-router'

export const desktopRoutes: RouteRecordRaw[] = [
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
