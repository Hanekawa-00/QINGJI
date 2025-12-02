<script setup lang="ts">
import DesktopSidebar from '@/components/desktop/DesktopSidebar.vue'
</script>

<template>
  <div class="desktop-layout">
    <DesktopSidebar />
    <main class="desktop-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.desktop-layout {
  min-height: 100vh;
  display: flex;
}

.desktop-content {
  flex: 1;
  padding: var(--spacing-4);
  overflow-y: auto;
}
</style>
