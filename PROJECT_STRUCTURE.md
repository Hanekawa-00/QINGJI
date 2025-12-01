# 项目结构说明

## 跨平台随手记账 APP - Tauri + Vue3 + TypeScript

### 项目已配置的内容

#### 技术栈
- **框架**: Tauri 2.9.4 (跨平台桌面应用框架)
- **前端框架**: Vue 3.5.25 + TypeScript
- **UI 组件库**: Vant 4.9.21 (移动端 UI)
- **路由管理**: Vue Router 4.6.3
- **状态管理**: Pinia 3.0.4
- **构建工具**: Vite 6.4.1

#### 项目结构

```
account-app/
├── src/                      # 前端源代码
│   ├── components/          # 可复用组件
│   ├── views/              # 页面视图
│   ├── router/             # 路由配置
│   ├── stores/             # Pinia 状态管理
│   ├── layouts/            # 布局组件
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript 类型定义
│   ├── assets/             # 静态资源
│   ├── App.vue            # 根组件
│   ├── main.ts            # 应用入口
│   └── vite-env.d.ts      # Vite 环境声明
│
├── src-tauri/              # Rust 后端代码
│   ├── src/               # Rust 源代码
│   ├── Cargo.toml         # Rust 依赖配置
│   └── tauri.conf.json    # Tauri 应用配置
│
├── public/                 # 公共静态资源
│
├── vite.config.ts         # Vite 配置 (已配置路径别名 @)
├── tsconfig.json          # TypeScript 配置 (已配置路径别名 @)
├── tsconfig.node.json     # Node 环境 TypeScript 配置
├── package.json           # 项目依赖配置
└── index.html            # HTML 入口文件
```

### 已配置的功能

#### 路径别名
- 配置 `@/` 指向 `src/` 目录
- 在代码中可以使用 `import { xxx } from '@/utils'` 的方式

#### 环境变量
- 支持 Tauri 开发服务器配置
- 热模块替换 (HMR) 已配置

#### 脚本命令

```bash
# 开发模式运行（桌面端）
pnpm tauri dev

# 构建应用
pnpm build

# 初始化 Android 开发环境
pnpm tauri android init

# Android 开发模式
pnpm tauri android dev

# 预览构建结果
pnpm preview
```

### 响应式设计说明

该项目设计为同时支持桌面端和移动端：

- **桌面端**: 使用 Native UI 风格（Tauri 窗口管理）
- **移动端**: 使用 Vant 4 组件库

在 `src/utils/platform.ts` 中实现平台检测：
- `isMobile()`: 检测是否为移动设备
- `isDesktop()`: 检测是否为桌面设备
- `getPlatform()`: 获取当前平台类型

### 下一步开发

1. **实现路由**
   - 在 `src/router/index.ts` 中定义应用路由

2. **创建视图**
   - 在 `src/views/` 中创建各个页面组件

3. **状态管理**
   - 在 `src/stores/` 中定义 Pinia store

4. **可复用组件**
   - 在 `src/components/` 中创建公共组件

5. **类型定义**
   - 在 `src/types/` 中定义 TypeScript 接口

6. **工具函数**
   - 在 `src/utils/` 中编写通用工具函数

### 开发提示

- 所有 Vue 组件使用 `<script setup lang="ts">` 语法
- 使用 TypeScript 编写所有代码
- 根据 `isMobile()` 函数动态调整 UI 布局
- 使用 Vant 4 的自动导入功能（已在 vite.config.ts 中配置）

