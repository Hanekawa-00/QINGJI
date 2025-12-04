<script setup lang="ts">
/**
 * ActionBar - 窗口控制栏组件
 * 参考 HuLa 项目设计，提供窗口拖拽、最小化、最大化、关闭功能
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { NPopover } from 'naive-ui'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { platform } from '@tauri-apps/plugin-os'

// Props
withDefaults(defineProps<{
  /** 显示最小化按钮 */
  showMin?: boolean
  /** 显示最大化按钮 */
  showMax?: boolean
  /** 显示关闭按钮 */
  showClose?: boolean
  /** 显示置顶按钮 */
  showPin?: boolean
  /** 可拖拽 */
  draggable?: boolean
  /** 图标颜色 */
  iconColor?: string
  /** 标题 */
  title?: string
}>(), {
  showMin: true,
  showMax: true,
  showClose: true,
  showPin: true,
  draggable: true
})

// 窗口实例
const appWindow = getCurrentWindow()

// 状态
const isMaximized = ref(false)
const isPinned = ref(false)
const isMacOS = ref(false)

// 检测平台
onMounted(async () => {
  try {
    const os = await platform()
    isMacOS.value = os === 'macos'
    
    // 初始化最大化状态
    isMaximized.value = await appWindow.isMaximized()
    
    // 监听窗口大小变化
    const unlisten = await appWindow.onResized(async () => {
      isMaximized.value = await appWindow.isMaximized()
    })
    
    onUnmounted(() => {
      unlisten()
    })
  } catch (e) {
    console.warn('ActionBar: Not in Tauri environment')
  }
})

// 最小化
async function handleMinimize() {
  try {
    await appWindow.minimize()
  } catch (e) {
    console.error('Failed to minimize:', e)
  }
}

// 最大化/还原
async function handleMaximize() {
  try {
    if (isMaximized.value) {
      await appWindow.unmaximize()
    } else {
      await appWindow.maximize()
    }
    isMaximized.value = !isMaximized.value
  } catch (e) {
    console.error('Failed to maximize:', e)
  }
}

// 关闭
async function handleClose() {
  try {
    await appWindow.close()
  } catch (e) {
    console.error('Failed to close:', e)
  }
}

// 置顶
async function handlePin() {
  try {
    isPinned.value = !isPinned.value
    await appWindow.setAlwaysOnTop(isPinned.value)
  } catch (e) {
    console.error('Failed to set always on top:', e)
  }
}

// 控制按钮位置（macOS 在左侧，Windows/Linux 在右侧）
const controlsPosition = computed(() => isMacOS.value ? 'left' : 'right')
</script>

<template>
  <div 
    class="action-bar"
    :class="{ 'mac': isMacOS, 'overlay-mode': !draggable }"
  >
    <!-- 拖拽区域（仅在可拖拽时显示） -->
    <div 
      v-if="draggable"
      class="drag-region"
      data-tauri-drag-region
    >
      <!-- 标题 -->
      <span v-if="title" class="window-title">{{ title }}</span>
    </div>

    <!-- 窗口控制按钮 -->
    <div class="window-controls" :class="controlsPosition">
      <!-- 置顶按钮 -->
      <n-popover v-if="showPin" trigger="hover" placement="bottom">
        <template #trigger>
          <button 
            class="control-btn pin"
            :class="{ active: isPinned }"
            @click="handlePin"
          >
            <span class="material-symbols-outlined">
              {{ isPinned ? 'push_pin' : 'push_pin' }}
            </span>
          </button>
        </template>
        <span>{{ isPinned ? '取消置顶' : '置顶窗口' }}</span>
      </n-popover>

      <!-- 最小化 -->
      <button 
        v-if="showMin"
        class="control-btn minimize"
        @click="handleMinimize"
      >
        <span class="material-symbols-outlined">remove</span>
      </button>

      <!-- 最大化/还原 -->
      <button 
        v-if="showMax"
        class="control-btn maximize"
        @click="handleMaximize"
      >
        <span class="material-symbols-outlined">
          {{ isMaximized ? 'filter_none' : 'crop_square' }}
        </span>
      </button>

      <!-- 关闭 -->
      <button 
        v-if="showClose"
        class="control-btn close"
        @click="handleClose"
      >
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.action-bar {
  display: flex;
  align-items: center;
  height: 32px;
  background: transparent;
  user-select: none;
  -webkit-app-region: drag;
}

/* 覆盖层模式 - 只显示按钮，无拖拽区域 */
.action-bar.overlay-mode {
  -webkit-app-region: no-drag;
  height: auto;
  padding: 8px;
}

.drag-region {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 12px;
}

.window-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.window-controls {
  display: flex;
  align-items: center;
  height: 100%;
  -webkit-app-region: no-drag;
}

.window-controls.left {
  order: -1;
  padding-left: 8px;
}

.window-controls.right {
  padding-right: 0;
}

.control-btn {
  width: 46px;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  -webkit-app-region: no-drag;
}

.control-btn .material-symbols-outlined {
  font-size: 18px;
}

.control-btn:hover {
  background: color-mix(in srgb, var(--color-text-muted) 10%, transparent);
  color: var(--color-text-strong);
}

.control-btn.pin {
  width: 36px;
}

.control-btn.pin .material-symbols-outlined {
  font-size: 16px;
  transform: rotate(45deg);
}

.control-btn.pin.active {
  color: var(--color-primary);
}

.control-btn.pin.active .material-symbols-outlined {
  transform: rotate(0deg);
}

.control-btn.close:hover {
  background: #e81123;
  color: white;
}

/* macOS 风格的交通灯按钮 */
.mac .window-controls {
  gap: 8px;
  padding: 0 12px;
}

.mac .control-btn {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  min-width: 12px;
}

.mac .control-btn .material-symbols-outlined {
  font-size: 8px;
  opacity: 0;
}

.mac .window-controls:hover .control-btn .material-symbols-outlined {
  opacity: 1;
}

.mac .control-btn.close {
  background: #ff5f57;
}

.mac .control-btn.minimize {
  background: #febc2e;
}

.mac .control-btn.maximize {
  background: #28c840;
}

.mac .control-btn.pin {
  width: 12px;
  height: 12px;
  background: #8e8e93;
}

.mac .control-btn.pin.active {
  background: var(--color-primary);
}
</style>
