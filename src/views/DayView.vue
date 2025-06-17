<template>
  <div class="day-view">
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

    <div class="habit-list-header">
      <h2>My Habits</h2>
      <button class="add-habit-btn" @click="showAddModal = true">+ Add Habit</button>
    </div>

    <div class="habit-list">
      <div
        v-for="habit in allHabits"
        :key="habit.id"
        class="habit-item"
        :class="{ inactive: !habit.active }"
      >
        <div class="habit-content">
          <label :class="{ disabled: isFutureDate }">
            <input
              type="checkbox"
              :checked="isHabitCompleted(habit.id)"
              @change="toggleHabit(habit.id)"
              :disabled="isFutureDate"
            />
            {{ habit.name }}
          </label>

          <HabitActionMenu
            :show-menu="showMenuForHabit === habit.id"
            :habit="habit"
            @close="showMenuForHabit = null"
            @edit="handleHabitEditStart(habit)"
            @stop="handleHabitStop(habit)"
            @delete="handleHabitDelete(habit)"
          >
            <button
              class="action-button"
              @click="showMenuForHabit = showMenuForHabit === habit.id ? null : habit.id"
            >
              ⋮
            </button>
          </HabitActionMenu>
        </div>
      </div>

      <EditHabitModal
        v-if="selectedHabit"
        v-model="showEditModal"
        :habit="selectedHabit"
        :existing-habits="allHabits.map((h) => h.name)"
        @habit-updated="handleHabitEdit"
        @update:modelValue="
          (val) => {
            if (!val) selectedHabit = null
          }
        "
      />
    </div>

    <AddHabitModal
      v-model="showAddModal"
      :existing-habits="allHabits.map((h) => h.name)"
      @habit-added="handleHabitAdded"
    />

    <div v-if="isFutureDate" class="future-date-message">Cannot mark habits for future dates</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AddHabitModal from '../components/AddHabitModal.vue'
import EditHabitModal from '../components/EditHabitModal.vue'
import HabitActionMenu from '../components/HabitActionMenu.vue'

const route = useRoute()
const router = useRouter()

// State
const showAddModal = ref(false)
const showEditModal = ref(false)
const selectedHabit = ref(null)
const showMenuForHabit = ref(null)
const habits = ref(loadHabits())
const userHabits = ref(loadUserHabits())
const defaultHabits = ref(loadDefaultHabits())

// Methods
function loadHabits() {
  const stored = localStorage.getItem('habits')
  return stored ? JSON.parse(stored) : {}
}

function loadUserHabits() {
  const stored = localStorage.getItem('userHabits')
  if (!stored) return []

  const data = JSON.parse(stored)
  return Array.isArray(data)
    ? data.map((item) => {
        if (typeof item === 'string') {
          return {
            id: item.toLowerCase().replace(/\s+/g, '-'),
            name: item,
            active: true,
            isDefault: false,
          }
        }
        return item
      })
    : []
}

function loadDefaultHabits() {
  const stored = localStorage.getItem('defaultHabits')
  if (stored) {
    const defaultHabitsList = JSON.parse(stored)
    if (defaultHabitsList.length > 0) {
      migrateDefaultHabitsToUserHabits(defaultHabitsList)
      localStorage.removeItem('defaultHabits')
    }
    return []
  }
  return []
}

function migrateDefaultHabitsToUserHabits(defaultHabits) {
  const userHabitsList = loadUserHabits()
  const existingIds = new Set(userHabitsList.map((h) => h.id))

  defaultHabits.forEach((habit) => {
    if (!existingIds.has(habit.id)) {
      userHabitsList.push({
        ...habit,
        deletable: true,
      })
    }
  })

  saveUserHabits(userHabitsList)
}

function saveUserHabits(habitsList) {
  const habitData = habitsList.map((habit) => ({
    id: habit.id,
    name: habit.name,
    active: habit.active,
    isDefault: habit.isDefault,
  }))
  localStorage.setItem('userHabits', JSON.stringify(habitData))
}

function saveHabits() {
  localStorage.setItem('habits', JSON.stringify(habits.value))
}

function normalizeDate(date) {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Computed properties
const currentDate = computed(() => {
  const dateParam = route.params.date
  const date = dateParam ? new Date(dateParam) : new Date()
  return normalizeDate(date)
})

const dateKey = computed(() => formatDateKey(currentDate.value))

const allHabits = computed(() => {
  return [...defaultHabits.value, ...userHabits.value].filter(
    (habit) => habit.active || hasCompletionHistory(habit.id),
  )
})

const formatCurrentDate = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const isFutureDate = computed(() => {
  const today = normalizeDate(new Date())
  return currentDate.value.getTime() > today.getTime()
})

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', {
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

// Event handlers
function handleHabitAdded(habitName) {
  userHabits.value.push({
    id: habitName.toLowerCase().replace(/\s+/g, '-'),
    name: habitName,
    active: true,
    isDefault: false,
  })
  saveUserHabits(userHabits.value)
}

function hasCompletionHistory(habitId) {
  return habits.value[dateKey.value]?.includes(habitId) || false
}

function handleHabitEditStart(habit) {
  selectedHabit.value = habit
  showEditModal.value = true
}

function handleHabitEdit(updatedHabit) {
  const index = userHabits.value.findIndex((h) => h.id === updatedHabit.id)
  if (index !== -1) {
    userHabits.value[index] = updatedHabit
    saveUserHabits(userHabits.value)
  }
}

function handleHabitStop(habit) {
  const index = userHabits.value.findIndex((h) => h.id === habit.id)
  if (index !== -1) {
    userHabits.value[index].active = false
    saveUserHabits(userHabits.value)
  }
}

function handleHabitDelete(habit) {
  const index = userHabits.value.findIndex((h) => h.id === habit.id)
  if (index !== -1) {
    userHabits.value.splice(index, 1)
    saveUserHabits(userHabits.value)
  }
}

function isHabitCompleted(habitId) {
  return habits.value[dateKey.value]?.includes(habitId) || false
}

function toggleHabit(habitId) {
  if (!habits.value[dateKey.value]) {
    habits.value[dateKey.value] = []
  }

  const index = habits.value[dateKey.value].indexOf(habitId)
  if (index === -1) {
    habits.value[dateKey.value].push(habitId)
  } else {
    habits.value[dateKey.value].splice(index, 1)
  }

  saveHabits()
}

function navigateToDay(offset) {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + offset)
  router.push(`/day/${formatDateKey(newDate)}`)
}

function isActiveDay(offset) {
  const date = new Date(currentDate.value)
  date.setDate(date.getDate() + offset)
  return formatDateKey(date) === dateKey.value
}

function formatDayButton(offset) {
  const date = new Date(currentDate.value)
  date.setDate(date.getDate() + offset)
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
}

function navigateMonth(delta) {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + delta)
  router.push(`/day/${formatDateKey(newDate)}`)
}

function goToToday() {
  router.push(`/day/${formatDateKey(new Date())}`)
}

function navigateWeeks(delta) {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + delta * 7)
  router.push(`/day/${formatDateKey(newDate)}`)
}

// Lifecycle hooks
onMounted(() => {
  // Remove the resize event listener since we're not using windowWidth anymore
})

// Watch for route changes
watch(
  () => route.params.date,
  () => {
    habits.value = loadHabits()
  },
)
</script>

<style scoped>
.day-view {
  max-width: 100%;
  margin: 0 auto;
  padding: 10px;
}

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

.habit-list-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
  align-items: stretch;
}

.habit-list-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
  text-align: center;
}

.add-habit-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: background-color 0.3s ease;
  min-height: 44px;
  width: 100%;
  touch-action: manipulation;
}

.add-habit-btn:hover {
  background-color: #45a049;
}

/* Tablet and desktop styles */
@media (min-width: 768px) {
  .day-view {
    max-width: 900px;
    padding: 30px;
  }

  .day-navigation {
    margin-bottom: 30px;
  }

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

  .habit-list-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .habit-list-header h2 {
    text-align: left;
  }

  .add-habit-btn {
    width: auto;
    padding: 8px 16px;
  }
}

.habit-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.habit-item {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 12px;
  background: white;
  transition: all 0.3s ease;
  touch-action: manipulation;
}

.habit-item.inactive {
  opacity: 0.6;
  background: #f9f9f9;
}

.habit-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.habit-item:active {
  background-color: #f9f9f9;
}

.habit-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 44px;
}

.habit-item label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex: 1;
  padding: 4px 0;
  font-size: 1rem;
}

.action-button {
  background: none;
  border: none;
  font-size: 1.4rem;
  color: #666;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  min-width: 44px;
  min-height: 44px;
  margin: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
}

.action-button:hover {
  background: #f5f5f5;
  color: #333;
}

.action-button:active {
  background: #e9e9e9;
}

.action-button:focus {
  outline: none;
  background: #f5f5f5;
}

.habit-item label.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.habit-item input[type='checkbox'] {
  width: 24px;
  height: 24px;
  cursor: pointer;
  border-radius: 6px;
  margin: 0;
}

/* Tablet and desktop styles */
@media (min-width: 768px) {
  .habit-item {
    padding: 15px;
  }

  .habit-item label {
    gap: 10px;
    font-size: 0.9rem;
  }

  .action-button {
    font-size: 1.2rem;
    padding: 4px 8px;
    min-width: 36px;
    min-height: 36px;
    margin: -4px;
  }

  .habit-item input[type='checkbox'] {
    width: 20px;
    height: 20px;
  }
}

.future-date-message {
  margin-top: 20px;
  padding: 10px;
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  border-radius: 4px;
  text-align: center;
}
</style>
