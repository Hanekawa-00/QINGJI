[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Hanekawa-00/QINGJI)

# QINGJI

QINGJI 是一个跨平台个人记账应用，基于 Tauri 2 + Vue 3 + TypeScript 构建。

- 桌面端: Windows / macOS / Linux
- 移动端: Android
- 开发模式支持 Web 预览（使用内存 Mock 数据）

## 目录

- [项目亮点](#项目亮点)
- [技术栈](#技术栈)
- [架构设计](#架构设计)
- [快速开始](#快速开始)
- [常用命令](#常用命令)
- [Android 构建与 ABI 说明](#android-构建与-abi-说明)
- [项目结构](#项目结构)
- [开发约定](#开发约定)
- [文档索引](#文档索引)

## 项目亮点

- 双端共享核心业务逻辑: 通过统一 Store 和类型定义，保证桌面端与移动端行为一致。
- 严格平台隔离: 构建阶段排除非目标平台代码，减小包体并降低运行时分支复杂度。
- 数据优先本地化: SQLite 本地存储，离线可用。
- 多币种支持: 主币种 + 汇率转换 + 历史换算。
- 主题系统: 多主题色与明暗模式切换。
- 国际化: 中文 / English 双语。

## 技术栈

前端:

- Vue 3 (`<script setup lang="ts">`)
- TypeScript
- Vite
- Pinia
- Vue Router
- Vue I18n
- Naive UI（桌面）
- Vant（移动）
- ECharts

宿主与后端:

- Tauri 2
- Rust
- SQLite（`tauri-plugin-sql`）

## 架构设计

### 1) 双平台分层

项目通过构建时插件实现平台代码隔离：

- 桌面页面/组件放在 `src/views/desktop`、`src/components/desktop`
- 移动页面/组件放在 `src/views/mobile`、`src/components/mobile`
- 共享组件放在 `src/components/common`

路由在运行时按平台切换：

- 桌面路由: `src/router/desktop.routes.ts`
- 移动路由: `src/router/mobile.routes.ts`

### 2) 数据流

```text
View -> Store (Pinia) -> Service -> SQLite
```

约定：页面与 hooks 不直接调用 service，统一经由 Store。

关键 Store:

- `src/stores/user.store.ts`: 交易、分类、统计
- `src/stores/currency.store.ts`: 主币种、汇率与重算
- `src/stores/theme.store.ts`: 主题和模式
- `src/stores/app.store.ts`: 平台与初始化状态

### 3) Web 回退模式

当不在 Tauri 容器中（`pnpm dev`）时，使用 `src/stores/user/mock-data.ts` 进行 UI 开发。

## 快速开始

### 环境要求

建议按 Tauri 2 官方要求准备环境。

- Node.js（建议 LTS）
- pnpm
- Rust toolchain（stable）
- Android 开发环境（Android Studio + SDK/NDK，若开发 Android）

Android 需要 Rust 目标（只需执行一次）:

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

### 安装依赖

```bash
pnpm install
```

### 启动开发

Web 预览（Mock 数据）:

```bash
pnpm dev
```

桌面端开发（Tauri）:

```bash
pnpm tauri:dev
```

Android 开发（需设备/模拟器）:

```bash
pnpm android:dev
```

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | Web 预览（Mock 数据） |
| `pnpm tauri:dev` | 桌面端开发 |
| `pnpm android:dev` | Android 端开发 |
| `pnpm test` | 交互式运行 Vitest 单元测试 |
| `pnpm test:run` | 单次运行 Vitest 单元测试（适合 CI） |
| `pnpm test:coverage` | 运行单测并生成覆盖率报告 |
| `pnpm test:e2e` | 运行 Playwright Web 双视口冒烟测试 |
| `pnpm test:all` | 运行 Vitest + Playwright 测试 |
| `pnpm build` | 类型检查 + 前端构建（主要质量门） |
| `pnpm tauri:build` | 构建桌面安装包 |
| `pnpm preview` | 预览前端构建产物 |

## Android 构建与 ABI 说明

### 一次构建全部 ABI APK

```bash
pnpm run android:build:all:release:installable
```

该脚本等价于 Tauri 官方推荐命令：

```bash
pnpm tauri android build --apk true --split-per-abi
```

Gradle 会在一次构建中为不同 ABI 生成独立 APK，避免逐个 `--target` 串行构建和手动复制/签名产物。

### 其他 Android 产物

通用 APK:

```bash
pnpm run android:build:universal
```

AAB:

```bash
pnpm run android:build:aab
```

## 项目结构

```text
src/
	components/
		common/
		desktop/
		mobile/
	views/
		desktop/
		mobile/
	stores/
	router/
	services/
	hooks/
	styles/
	locales/
	utils/
src-tauri/
	src/
	capabilities/
	gen/android/
docs/
scripts/
```

## 开发约定

### 命名与代码风格

- 组件: `PascalCase.vue`
- Hook: `useXxx.ts`
- Store: `*.store.ts`
- 全部 Vue SFC 使用 `<script setup lang="ts">`

### 平台隔离（重要）

- 不要把平台专属页面/组件放错目录。
- 如果新增页面同时面向两端，优先实现共享逻辑，再分别实现桌面/移动 UI。

### 质量门

项目使用 Vitest 覆盖共享业务逻辑和组件回归，使用 Playwright 覆盖桌面/移动 Web 双视口冒烟流程，并通过 `vue-tsc` 与 Vite 构建检查生产可用性。提交前建议至少运行：

```bash
pnpm test:run
pnpm test:e2e
pnpm build
cargo test --manifest-path src-tauri/Cargo.toml
```

需要查看覆盖率时运行：

```bash
pnpm test:coverage
```

覆盖率报告只用于观察趋势，不作为 CI 失败阈值。Playwright 会生成 `playwright-report/` 与 `test-results/`，其中包含失败 trace 和冒烟截图产物，目录不会提交到仓库。

### 提交建议

推荐使用 Conventional Commits：

```text
feat(scope): short summary
fix(scope): short summary
refactor(scope): short summary
docs(scope): short summary
chore(scope): short summary
```
