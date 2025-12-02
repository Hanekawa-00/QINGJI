<template>
  <div class="mobile-layout">
    <main class="mobile-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.mobile-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
}
</style>
