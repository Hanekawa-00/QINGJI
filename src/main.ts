import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";

// 导入全局样式
import "@/styles/tokens.css";
import "@/styles/base.css";

// 导入 Material Symbols 图标字体
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
document.head.appendChild(link);

// 导入 Manrope 字体
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap';
document.head.appendChild(fontLink);

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.mount("#app");
