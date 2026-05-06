import { mount, shallowMount, type MountingOptions } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import {
  createMemoryHistory,
  createRouter,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import type { Component } from 'vue'
import en from '@/locales/en'
import zhCN from '@/locales/zh-CN'

export function createTestI18n(locale = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: {
      en,
      'zh-CN': zhCN,
    },
  })
}

export function createTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

export async function createTestRouter(
  routes: RouteRecordRaw[] = [],
  initialPath = '/',
): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: routes.length > 0 ? routes : [{ path: '/', component: { template: '<div />' } }],
  })
  await router.push(initialPath)
  await router.isReady()
  return router
}

export async function mountWithPlugins<T extends Component>(
  component: T,
  options: MountingOptions<unknown> & {
    routes?: RouteRecordRaw[]
    initialPath?: string
    locale?: string
  } = {},
) {
  const pinia = createTestPinia()
  const i18n = createTestI18n(options.locale)
  const router = await createTestRouter(options.routes, options.initialPath)

  const wrapper = mount(component, {
    ...options,
    global: {
      ...options.global,
      plugins: [pinia, i18n, router, ...(options.global?.plugins ?? [])],
    },
  })

  return { wrapper, pinia, i18n, router }
}

export async function shallowMountWithPlugins<T extends Component>(
  component: T,
  options: MountingOptions<unknown> & {
    routes?: RouteRecordRaw[]
    initialPath?: string
    locale?: string
  } = {},
) {
  const pinia = createTestPinia()
  const i18n = createTestI18n(options.locale)
  const router = await createTestRouter(options.routes, options.initialPath)

  const wrapper = shallowMount(component, {
    ...options,
    global: {
      ...options.global,
      plugins: [pinia, i18n, router, ...(options.global?.plugins ?? [])],
    },
  })

  return { wrapper, pinia, i18n, router }
}
