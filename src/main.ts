import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import i18n from "./locales";
import App from "./App.vue";
import { setupSafeArea } from "@/hooks";

// 导入全局样式
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/layouts/index.css";
import "@/styles/components/index.css";
import "@/styles/views/index.css";
import "@/styles/mobile.css";

// 导入 Material Symbols 图标字体（本地）
import "material-symbols";

// 导入 Manrope 字体（本地）
import "@fontsource/manrope/300.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);

// 初始化安全区域（移动端）
setupSafeArea().then(() => {
  app.mount("#app");
});
