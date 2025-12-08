import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver, VantResolver } from 'unplugin-vue-components/resolvers'

// Tauri CLI 会自动设置这个环境变量（移动端开发时）
const host = process.env.TAURI_DEV_HOST;

/**
 * 判断是否为桌面平台
 */
function isDesktopPlatform(platform: string | undefined): boolean {
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
 */
function getResolvers(isDesktop: boolean) {
  if (isDesktop) {
    return [NaiveUiResolver()]
  }
  return [VantResolver()]
}

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())
  
  // 检测 Tauri 平台（由 Tauri CLI 设置）
  const tauriPlatform = process.env.TAURI_ENV_PLATFORM
  const isDesktop = isDesktopPlatform(tauriPlatform)
  
  console.log(`[Vite] Platform: ${tauriPlatform || 'web'}, isDesktop: ${isDesktop}, TAURI_DEV_HOST: ${host || 'not set'}`)
  
  return {
    plugins: [
      vue(),
      Components({
        // 根据平台动态配置组件目录
        dirs: getComponentsDirs(isDesktop),
        // 根据平台选择解析器（NaiveUI 或 Vant）
        resolvers: getResolvers(isDesktop),
        // 生成对应平台的类型声明
        dts: isDesktop ? 'components.d.ts' : 'components.mobile.d.ts',
      }),
    ],
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
      hmr: {
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
