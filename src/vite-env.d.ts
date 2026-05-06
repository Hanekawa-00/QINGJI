/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_QINGJI_PLATFORM?: 'desktop' | 'mobile'
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
