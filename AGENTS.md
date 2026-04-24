# Repository Guidelines

## Project Structure & Module Organization

QINGJI is a Tauri 2 + Vue 3 + TypeScript personal finance app. Frontend code lives in `src/`; Tauri/Rust host code and mobile build output live in `src-tauri/`. Keep platform-specific UI in `src/views/desktop`, `src/components/desktop`, `src/views/mobile`, and `src/components/mobile`. Shared UI belongs in `src/components/common`; shared logic belongs in `src/stores`, `src/services`, `src/hooks`, `src/utils`, and `src/types`. Styles are grouped under `src/styles`, translations under `src/locales`, static public assets under `public`, app icons under `src-tauri/icons`, helper scripts under `scripts`, and architecture/build notes under `docs`.

## Build, Test, and Development Commands

Use `pnpm install` to install dependencies. Use `pnpm dev` for Vite web preview with mock data, `pnpm tauri:dev` for desktop development, and `pnpm android:dev` for Android device/emulator development. Use `pnpm build` as the main quality gate; it runs `vue-tsc --noEmit` and builds the frontend. Use `pnpm tauri:build` for desktop packages and `pnpm preview` to inspect the Vite production build. Android release helpers include `pnpm run android:build:all:release:installable` for split-per-ABI APKs, `pnpm run android:build:universal` for a universal APK, and `pnpm run android:build:aab` for an app bundle.

## Coding Style & Naming Conventions

Write Vue SFCs with `<script setup lang="ts">`. Name components `PascalCase.vue`, hooks `useXxx.ts`, and stores `*.store.ts`. Prefer existing aliases such as `@/stores/app.store` over long relative paths. Keep desktop-only and mobile-only code in their platform folders; implement shared business behavior in stores/services first, then adapt UI per platform. Follow the local formatting style in nearby files, including two-space indentation in blocks.

## Testing Guidelines

This repository currently has no dedicated test runner or coverage target. Before opening a PR, run `pnpm build`. For behavior changes, manually verify the affected mode: `pnpm dev` for mock-data UI work, `pnpm tauri:dev` for desktop integration, or `pnpm android:dev` for mobile behavior.

## Commit & Pull Request Guidelines

Recent history follows Conventional Commits, often with Chinese summaries: `feat: ...`, `fix: ...`, and scoped forms such as `feat(android): ...`. Keep commits focused and imperative. PRs should describe the change, list verification commands, link related issues, and include screenshots or recordings for UI changes across desktop/mobile when relevant.

## Agent-Specific Instructions

Do not edit generated Android files under `src-tauri/gen/android` unless the task explicitly targets packaging output. Avoid committing build artifacts from `dist` or generated APK directories. Preserve user changes already present in the worktree.
