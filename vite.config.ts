/// <reference types="vitest" />

import { defineConfig, loadEnv, Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver, VantResolver } from 'unplugin-vue-components/resolvers'

// Tauri CLI 会自动设置这个环境变量（移动端开发时）
const host = process.env.TAURI_DEV_HOST;
const disableHmr = process.env.VITE_DISABLE_HMR === 'true'

/**
 * 判断是否为桌面平台
 */
function isDesktopPlatform(platform: string | undefined, appPlatform: string | undefined): boolean {
  if (appPlatform === 'desktop') return true
  if (appPlatform === 'mobile') return false
  return !platform || ['windows', 'darwin', 'linux'].includes(platform)
}

/**
 * 获取组件目录（根据平台）
 */
function getComponentsDirs(isDesktop: boolean): string[] {
  const baseDirs = ['src/components/common']
  if (isDesktop) {
    return [...baseDirs, 'src/components/desktop']
  }
  return [...baseDirs, 'src/components/mobile']
}

/**
 * 获取组件解析器（根据平台）
 * 注意：common 组件中也使用了 NaiveUI，所以两端都需要 NaiveUI 解析器
 */
function getResolvers(isDesktop: boolean) {
  if (isDesktop) {
    // 桌面端：只用 NaiveUI
    return [NaiveUiResolver()]
  }
  // 移动端：Vant + NaiveUI（common 组件如 SettingsPanel 使用了 NaiveUI）
  return [VantResolver(), NaiveUiResolver()]
}

/**
 * 平台代码排除插件
 * 在构建时排除另一个平台的视图、布局和路由文件
 */
function platformExcludePlugin(isDesktop: boolean): Plugin {
  // 需要排除的路径模式
  const excludePatterns = isDesktop
    ? [
        /[\\/]views[\\/]mobile[\\/]/,
        /[\\/]layouts[\\/]MobileLayout\.vue/,
        /[\\/]components[\\/]mobile[\\/]/,
        /[\\/]router[\\/]mobile\.routes/
      ]
    : [
        /[\\/]views[\\/]desktop[\\/]/,
        /[\\/]layouts[\\/]DesktopLayout\.vue/,
        /[\\/]components[\\/]desktop[\\/]/,
        /[\\/]router[\\/]desktop\.routes/
      ]

  return {
    name: 'platform-exclude',
    enforce: 'pre',
    resolveId(source, importer, options) {
      // 将源路径标准化
      const normalizedSource = source.replace(/\\/g, '/')
      
      // 检查是否匹配排除模式
      if (excludePatterns.some(pattern => pattern.test(normalizedSource))) {
        console.log(`[platform-exclude] Excluding: ${source}`)
        return '\0platform-empty:' + source
      }
      return null
    },
    load(id) {
      if (id.startsWith('\0platform-empty:')) {
        const originalPath = id.replace('\0platform-empty:', '')
        // 根据文件类型返回不同的空模块
        if (originalPath.includes('.routes')) {
          // 路由文件：返回空数组
          return `export const desktopRoutes = []; export const mobileRoutes = [];`
        }
        // Vue 组件：返回空组件
        return `export default { render: () => null }`
      }
      return null
    }
  }
}

// https://vite.dev/config/
export default defineConfig(async ({ mode, command }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())
  
  // 检测 Tauri 平台（由 Tauri CLI 设置）
  const tauriPlatform = process.env.TAURI_ENV_PLATFORM
  const appPlatform = process.env.VITE_QINGJI_PLATFORM
  const isDesktop = isDesktopPlatform(tauriPlatform, appPlatform)
  const isBuild = command === 'build'
  
  console.log(`[Vite] Platform: ${appPlatform || tauriPlatform || 'web'}, isDesktop: ${isDesktop}, mode: ${mode}, command: ${command}`)
  
  return {
    plugins: [
      // 构建时启用平台代码排除
      isBuild && platformExcludePlugin(isDesktop),
      vue(),
      Components({
        // 根据平台动态配置组件目录
        dirs: getComponentsDirs(isDesktop),
        // 根据平台选择解析器（NaiveUI 或 Vant）
        resolvers: getResolvers(isDesktop),
        // 生成对应平台的类型声明
        dts: isDesktop ? 'components.d.ts' : 'components.mobile.d.ts',
      }),
    ].filter(Boolean),
    
    // 定义平台常量，用于条件编译
    define: {
      __PLATFORM__: JSON.stringify(isDesktop ? 'desktop' : 'mobile'),
      __IS_DESKTOP__: isDesktop,
      __IS_MOBILE__: !isDesktop,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@views": path.resolve(__dirname, "./src/views"),
        "@stores": path.resolve(__dirname, "./src/stores"),
        "@utils": path.resolve(__dirname, "./src/utils"),
        "@styles": path.resolve(__dirname, "./src/styles"),
        "@types": path.resolve(__dirname, "./src/types"),
        "@layouts": path.resolve(__dirname, "./src/layouts"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
      },
    },

    // 构建优化
    build: {
      // 生产环境移除 console 和 debugger
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      // 分包策略
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'ui-vendor': ['naive-ui', 'vant'],
            'chart-vendor': ['echarts', 'vue-echarts'],
          },
        },
      },
      // 压缩大小报告
      reportCompressedSize: false,
      // chunk 大小警告阈值
      chunkSizeWarningLimit: 1000,
    },

    test: {
      environment: 'jsdom',
      setupFiles: ['src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.ts'],
      css: true,
      server: {
        deps: {
          inline: ['vant'],
        },
      },
      globals: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        reportsDirectory: 'coverage',
        include: ['src/**/*.{ts,vue}'],
        exclude: [
          'src/**/*.d.ts',
          'src/main.ts',
          'src/vite-env.d.ts',
          'src/test/**',
          'src/**/*.test.ts',
        ],
      },
    },

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent Vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port: 1420,
      strictPort: true,
      // 模拟器开发：监听所有接口，配合 adb reverse 使用
      host: '0.0.0.0',
      hmr: disableHmr ? false : {
        protocol: "ws",
        host: host || 'localhost',
        port: 1421,
      },
      watch: {
        // 3. tell Vite to ignore watching `src-tauri`
        ignored: ["**/src-tauri/**"],
      },
    },
  }
});
