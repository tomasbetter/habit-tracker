<template>
  <div class="day-navigation">
    <!-- Month navigation -->
    <div class="month-navigation">
      <button @click="navigateMonth(-1)" class="nav-btn month-nav">‹</button>
      <span class="month-display">{{ currentMonthYear }}</span>
      <button @click="navigateMonth(1)" class="nav-btn month-nav">›</button>
    </div>

    <!-- Week navigation -->
    <div class="nav-buttons">
      <button
        v-for="offset in weekOffsets"
        :key="offset"
        :class="['nav-btn', { active: isActiveDay(offset) }]"
        @click="navigateToDay(offset)"
      >
        {{ formatDayButton(offset) }}
      </button>
    </div>

    <!-- Quick navigation -->
    <div class="quick-nav">
      <button @click="goToToday" class="nav-btn quick-nav-btn">Today</button>
      <button @click="navigateWeeks(-1)" class="nav-btn quick-nav-btn">← Week</button>
      <button @click="navigateWeeks(1)" class="nav-btn quick-nav-btn">Week →</button>
    </div>

    <div class="current-date">{{ formatCurrentDate }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  currentDate: { type: Date, required: true }
})

const router = useRouter()

// Computed properties
const formatCurrentDate = computed(() => 
  props.currentDate.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
)

const currentMonthYear = computed(() => 
  props.currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
)

const weekOffsets = computed(() => Array.from({ length: 7 }, (_, i) => i - 3))

// Utility functions
const formatDateKey = date => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDateWithOffset = offset => {
  const date = new Date(props.currentDate)
  date.setDate(date.getDate() + offset)
  return date
}

// Navigation methods
const navigateToDay = offset => {
  const newDate = getDateWithOffset(offset)
  router.push(`/day/${formatDateKey(newDate)}`)
}

const isActiveDay = offset => 
  formatDateKey(getDateWithOffset(offset)) === formatDateKey(props.currentDate)

const formatDayButton = offset => 
  getDateWithOffset(offset).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })

const navigateMonth = delta => {
  const newDate = new Date(props.currentDate)
  newDate.setMonth(newDate.getMonth() + delta)
  router.push(`/day/${formatDateKey(newDate)}`)
}

const goToToday = () => router.push(`/day/${formatDateKey(new Date())}`)

const navigateWeeks = delta => {
  const newDate = getDateWithOffset(delta * 7)
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

.nav-btn {
  border: 1px solid #ddd;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.nav-btn:hover {
  background: #f5f5f5;
}

.month-nav {
  background: #f0f0f0;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 1.4rem;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.month-nav:hover {
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

.nav-buttons .nav-btn {
  padding: 8px 4px;
  white-space: nowrap;
  font-size: 0.75rem;
  min-height: 36px;
  flex: 1;
  max-width: 50px;
  text-align: center;
  touch-action: manipulation;
  overflow: hidden;
}

.nav-buttons .nav-btn.active {
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
  font-size: 0.85rem;
  color: #555;
  padding: 6px 12px;
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

  .nav-buttons .nav-btn {
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
