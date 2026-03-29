# QINGJI Project Guidelines

This file is the single source of truth for AI agents interacting with the QINGJI repository. It is a dual-platform (Desktop + Mobile) personal finance application built with Vue 3, TypeScript, Tauri 2, and Rust.

## 1. Architecture & Platform Separation

This project strictly distinguishes between Desktop (Windows, macOS, Linux) and Mobile (Android) platforms.

**Build-time Exclusion (Critical Pattern):**
- **Vite Plugin:** `vite.config.ts` uses `platformExcludePlugin` to exclude the incorrect platform's views, layout, components, and routes by replacing their files with virtual empty modules during the build.
- **Rules:** 
    - Desktop files MUST be in `views/desktop/` and `components/desktop/`.
    - Mobile files MUST be in `views/mobile/` and `components/mobile/`.
    - Misnaming or placing platform files elsewhere will break the build.

**Runtime & Component Resolution:**
- **Routing:** `src/router/index.ts` calls `detectPlatform()` and loads either `desktop.routes.ts` or `mobile.routes.ts`.
- **Components:** `unplugin-vue-components` resolves shared (`components/common/`) plus the current platform's components (`desktop/` or `mobile/`). Manual imports for these are not necessary.

## 2. State Management & Data Flow

**Pinia Stores are the Single Source of Truth.** Views and hooks MUST NEVER call services directly.

- **`src/stores/user.store.ts`**: The core domain logic. It owns `transactions` and `categories`. All computed statistics (`totalBalance`, `monthlyIncome/Expense`, etc.) are derived here. 
    - **Optimistic Writes:** Mutations update the store immediately, then persist to SQLite asynchronously.
- **`src/stores/currency.store.ts`**: Handles the primary currency and Frankfurter API rates. `recalculateAllTransactions()` manages historical rate updates.
- **`src/stores/theme.store.ts`**: Manages the 5 themes and light/dark modes. Uses CSS custom properties and persists via `localStorage`.
- **`src/stores/app.store.ts`**: Handles platform initialization state.

**Database Layer:**
- **`src/services/database.ts`**: The exclusive location for raw SQL queries (`tauri-plugin-sql`).
- **Web Fallback:** When running without Tauri (`pnpm dev`), stores use in-memory mock data from `src/stores/user/mock-data.ts`.

## 3. Development Workflow

- `pnpm tauri:dev`: Run desktop app with hot reload.
- `pnpm dev`: Run web-only mode (mock data) for UI development.
- `pnpm android:dev`: Run Android app (requires SDK).
- `pnpm build`: Runs `vue-tsc --noEmit` followed by `vite build`. (This is the primary quality gate—no ESLint or tests).

## 4. Coding Conventions

- **Vue SFCs:** Use `<script setup lang="ts">`.
- **Naming:** 
    - `PascalCase.vue` for components.
    - `useXxx.ts` for hooks.
    - `*.store.ts` for stores.
- **Types:** All domain types reside in `src/types/index.ts`.
- **Styling:** CSS must be placed in `src/styles/`, not in SFC `<style>` blocks. Design tokens belong in `tokens.css`.
- **Aliases:** Keep path aliases synchronized between `tsconfig.json` and `vite.config.ts` (`@/`, `@components/`, `@stores/`, `@services/`, `@views/`, `@hooks/`, `@utils/`).
- **Mobile Details:** 
    - Routes (`mobile.routes.ts`) use `meta: { keepAlive: true }` for primary views (Dashboard, Calendar) to retain state.
    - Apply `src/hooks/useSafeArea.ts` and `src/hooks/useAndroidBack.ts` where necessary.

## 5. Global Constants

- Use injected globals `__IS_DESKTOP__` and `__IS_MOBILE__` for tree-shakable platform logic.

## 6. Commit & Pull Request Guidelines

Recent history follows Conventional Commits.
- Prefer `type(scope): short summary` (`feat`, `fix`, `refactor`, `docs`, `chore`).
- Keep each commit focused on one logical change.
- PRs should specify if they impact `desktop`, `mobile`, or both, and include screenshots for UI changes.
