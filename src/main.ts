import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import i18n from "./locales";
import App from "./App.vue";
import { setupSafeArea } from "@/hooks";
import { setToastDefaultOptions } from "vant";

// 导入全局样式
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/layouts/index.css";
import "@/styles/components/index.css";
import "@/styles/views/index.css";
import "@/styles/mobile.css";

// 导入 Material Symbols Outlined 图标字体（本地）
import "material-symbols/outlined.css";

// 导入 Manrope 字体（仅 Latin 子集 + woff2，适配移动端）
import "@fontsource/manrope/latin-300.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);

// 初始化安全区域（移动端）
setupSafeArea().then(() => {
  // 官方支持通过全局配置设置 Toast 位置，统一用顶部并配合 safe-area 偏移。
  setToastDefaultOptions({ position: "top" });

  app.mount("#app");
});
