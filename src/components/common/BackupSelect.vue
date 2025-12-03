<script setup lang="ts">
/**
 * 备份选择下拉框组件
 * 每个选项带有删除按钮
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface BackupOption {
  label: string
  value: string
}

interface Props {
  options: BackupOption[]
  modelValue: string | null
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select a backup'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'delete': [value: string]
}>()

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)

// 当前选中的选项
const selectedOption = computed(() => 
  props.options.find(opt => opt.value === props.modelValue)
)

// 显示的文本
const displayText = computed(() => 
  selectedOption.value?.label || props.placeholder
)

// 切换下拉框
function toggleDropdown() {
  isOpen.value = !isOpen.value
}

// 选中选项
function selectOption(option: BackupOption) {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

// 删除选项
function deleteOption(e: Event, value: string) {
  e.stopPropagation()
  emit('delete', value)
}

// 点击外部关闭
function handleClickOutside(e: MouseEvent) {
  if (selectRef.value && !selectRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="backup-select" ref="selectRef">
    <!-- 选择框 -->
    <div 
      class="backup-select-trigger" 
      :class="{ open: isOpen, placeholder: !selectedOption }"
      @click="toggleDropdown"
    >
      <span class="backup-select-text">{{ displayText }}</span>
      <span class="backup-select-arrow material-symbols-outlined">
        {{ isOpen ? 'expand_less' : 'expand_more' }}
      </span>
    </div>

    <!-- 下拉列表 -->
    <Transition name="dropdown">
      <div v-if="isOpen" class="backup-select-dropdown">
        <div 
          v-for="option in options" 
          :key="option.value"
          class="backup-select-option"
          :class="{ selected: option.value === modelValue }"
          @click="selectOption(option)"
        >
          <span class="backup-option-text">{{ option.label }}</span>
          <button 
            class="backup-option-delete"
            @click="deleteOption($event, option.value)"
            title="Delete this backup"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div v-if="options.length === 0" class="backup-select-empty">
          No backups available
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.backup-select {
  position: relative;
  width: 100%;
}

.backup-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 38px;
}

.backup-select-trigger:hover {
  border-color: var(--color-primary);
}

.backup-select-trigger.open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(43, 215, 118, 0.15);
}

.backup-select-trigger.placeholder .backup-select-text {
  color: var(--color-text-muted);
}

.backup-select-text {
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.backup-select-arrow {
  font-size: 20px;
  color: var(--color-text-muted);
  transition: transform 0.2s;
}

.backup-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  max-height: 240px;
  overflow-y: auto;
}

.backup-select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;
  gap: 8px;
}

.backup-select-option:first-child {
  border-radius: 7px 7px 0 0;
}

.backup-select-option:last-child {
  border-radius: 0 0 7px 7px;
}

.backup-select-option:only-child {
  border-radius: 7px;
}

.backup-select-option:hover {
  background: rgba(43, 215, 118, 0.08);
}

.backup-select-option.selected {
  background: rgba(43, 215, 118, 0.12);
}

.backup-select-option.selected .backup-option-text {
  color: var(--color-primary);
  font-weight: 500;
}

.backup-option-text {
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.backup-option-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.backup-option-delete:hover {
  background: var(--color-expense);
  color: white;
}

.backup-option-delete .material-symbols-outlined {
  font-size: 16px;
}

.backup-select-empty {
  padding: 16px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
