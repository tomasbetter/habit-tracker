<template>
  <div class="day-navigation">
    <!-- Month navigation -->
    <div class="month-navigation">
      <button @click="navigateMonth(-1)" class="month-nav-btn">‹</button>
      <span class="month-display">{{ currentMonthYear }}</span>
      <button @click="navigateMonth(1)" class="month-nav-btn">›</button>
    </div>

    <!-- Week navigation around current date -->
    <div class="nav-buttons">
      <button
        v-for="offset in weekOffsets"
        :key="offset"
        :class="{ active: isActiveDay(offset) }"
        @click="navigateToDay(offset)"
        :disabled="false"
      >
        {{ formatDayButton(offset) }}
      </button>
    </div>

    <!-- Quick navigation options -->
    <div class="quick-nav">
      <button @click="goToToday" class="quick-nav-btn">Today</button>
      <button @click="navigateWeeks(-1)" class="quick-nav-btn">← Week</button>
      <button @click="navigateWeeks(1)" class="quick-nav-btn">Week →</button>
    </div>

    <div class="current-date">
      {{ formatCurrentDate }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  currentDate: {
    type: Date,
    required: true,
  },
})

const router = useRouter()

// Computed properties
const formatCurrentDate = computed(() => {
  return props.currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const currentMonthYear = computed(() => {
  return props.currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })
})

const weekOffsets = computed(() => {
  const offsets = []
  for (let i = -3; i <= 3; i++) {
    offsets.push(i)
  }
  return offsets
})

// Utility functions
function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Navigation methods
function navigateToDay(offset) {
  const newDate = new Date(props.currentDate)
  newDate.setDate(newDate.getDate() + offset)
  router.push(`/day/${formatDateKey(newDate)}`)
}

function isActiveDay(offset) {
  const date = new Date(props.currentDate)
  date.setDate(date.getDate() + offset)
  return formatDateKey(date) === formatDateKey(props.currentDate)
}

function formatDayButton(offset) {
  const date = new Date(props.currentDate)
  date.setDate(date.getDate() + offset)
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
}

function navigateMonth(delta) {
  const newDate = new Date(props.currentDate)
  newDate.setMonth(newDate.getMonth() + delta)
  router.push(`/day/${formatDateKey(newDate)}`)
}

function goToToday() {
  router.push(`/day/${formatDateKey(new Date())}`)
}

function navigateWeeks(delta) {
  const newDate = new Date(props.currentDate)
  newDate.setDate(newDate.getDate() + delta * 7)
  router.push(`/day/${formatDateKey(newDate)}`)
}
</script>

<style scoped>
.day-navigation {
  margin-bottom: 20px;
}

.month-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 15px;
}

.month-nav-btn {
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 1.4rem;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.month-nav-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.month-display {
  font-size: 1.1em;
  color: #333;
  font-weight: 500;
  min-width: 150px;
  text-align: center;
}

.nav-buttons {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  justify-content: space-between;
  width: 100%;
}

.nav-buttons::-webkit-scrollbar {
  display: none;
}

.nav-buttons button {
  padding: 8px 4px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: white;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  font-size: 0.75rem;
  min-height: 36px;
  flex: 1;
  max-width: 50px;
  text-align: center;
  touch-action: manipulation;
  overflow: hidden;
}

.nav-buttons button:hover {
  background: #f5f5f5;
}

.nav-buttons button.active {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.quick-nav {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
  justify-content: center;
}

.quick-nav-btn {
  background: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 16px;
  font-size: 0.85rem;
  color: #555;
  cursor: pointer;
  padding: 6px 12px;
  transition: all 0.2s ease;
}

.quick-nav-btn:hover {
  background: #e8e8e8;
  color: #333;
}

.current-date {
  font-size: 1.2em;
  color: #333;
  margin-bottom: 15px;
  text-align: center;
}

/* Tablet and desktop styles */
@media (width >= 768px) {
  .nav-buttons {
    gap: 10px;
    margin-bottom: 15px;
    justify-content: center;
  }

  .nav-buttons button {
    padding: 8px 16px;
    font-size: 1rem;
    flex: none;
    max-width: none;
    min-width: 80px;
  }

  .current-date {
    font-size: 1.5em;
    margin-bottom: 20px;
    text-align: left;
  }
}
</style>
