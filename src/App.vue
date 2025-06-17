<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header>
      <h1>Habit Tracker</h1>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style>
.app {
  min-height: 100vh;
  background-color: #f5f5f5;
}

header {
  background-color: #4caf50;
  color: white;
  padding: 0.75rem;
  text-align: center;
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
}

header h1 {
  margin: 0;
  font-size: 1.5rem;
}

main {
  padding: 1rem;
  display: flex;
  justify-content: center;
}

/* Tablet and desktop styles */
@media (width >= 768px) {
  header {
    padding: 1rem;
  }

  header h1 {
    font-size: 1.8rem;
  }

  main {
    padding: 1rem;
  }
}
</style>
