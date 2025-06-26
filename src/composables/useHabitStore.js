import { ref, computed, watch } from 'vue'

// Constants
const STORAGE_KEYS = {
  HABITS: 'habits',
  USER_HABITS: 'userHabits'
}

// Utility functions (moved outside to avoid recreation)
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

function generateHabitId(name) {
  return name.toLowerCase().replace(/\s+/g, '-')
}

function createHabitObject(name, isDefault = false) {
  return {
    id: generateHabitId(name),
    name,
    active: true,
    isDefault
  }
}

export function useHabitStore() {
  const habits = ref({})
  const userHabits = ref([])
  const isLoading = ref(false)

  // Load functions with error handling
  function loadHabits() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HABITS)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Error loading habits:', error)
      return {}
    }
  }

  function loadUserHabits() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_HABITS)
      if (!stored) return []

      const data = JSON.parse(stored)
      return Array.isArray(data)
        ? data.map((item) => {
            if (typeof item === 'string') {
              return createHabitObject(item)
            }
            return item
          })
        : []
    } catch (error) {
      console.error('Error loading user habits:', error)
      return []
    }
  }

  // Initialize data
  habits.value = loadHabits()
  userHabits.value = loadUserHabits()

  // Save functions with debouncing
  let saveTimeout = null
  function debouncedSave(key, data) {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data))
      } catch (error) {
        console.error(`Error saving ${key}:`, error)
      }
    }, 100)
  }

  function saveUserHabits() {
    const habitData = userHabits.value.map((habit) => ({
      id: habit.id,
      name: habit.name,
      active: habit.active,
      isDefault: habit.isDefault,
    }))
    debouncedSave(STORAGE_KEYS.USER_HABITS, habitData)
  }

  function saveHabits() {
    debouncedSave(STORAGE_KEYS.HABITS, habits.value)
  }

  // Computed properties with memoization
  const allHabits = computed(() => {
    return userHabits.value
  })

  const activeHabits = computed(() => {
    return userHabits.value.filter(habit => habit.active)
  })

  const inactiveHabits = computed(() => {
    return userHabits.value.filter(habit => !habit.active)
  })

  // Utility functions
  function hasCompletionHistory(habitId) {
    return Object.values(habits.value).some(habitList => 
      Array.isArray(habitList) && habitList.includes(habitId)
    )
  }

  function isHabitCompleted(habitId, dateKey) {
    return habits.value[dateKey]?.includes(habitId) || false
  }

  function toggleHabit(habitId, dateKey) {
    if (!habits.value[dateKey]) {
      habits.value[dateKey] = []
    }

    const index = habits.value[dateKey].indexOf(habitId)
    if (index === -1) {
      habits.value[dateKey].push(habitId)
    } else {
      habits.value[dateKey].splice(index, 1)
    }

    saveHabits()
  }

  function getCompletedHabits(dateKey) {
    return habits.value[dateKey] || []
  }

  // Habit management functions with validation
  function addHabit(habitName) {
    if (!habitName?.trim()) {
      throw new Error('Habit name is required')
    }

    const trimmedName = habitName.trim()
    const existingHabit = userHabits.value.find(h => h.name.toLowerCase() === trimmedName.toLowerCase())
    
    if (existingHabit) {
      throw new Error('Habit already exists')
    }

    userHabits.value.push(createHabitObject(trimmedName))
    saveUserHabits()
  }

  function updateHabit(updatedHabit) {
    if (!updatedHabit?.id) {
      throw new Error('Invalid habit data')
    }

    const index = userHabits.value.findIndex((h) => h.id === updatedHabit.id)
    if (index !== -1) {
      userHabits.value[index] = { ...userHabits.value[index], ...updatedHabit }
      saveUserHabits()
    }
  }

  function stopHabit(habit) {
    if (!habit?.id) return

    const index = userHabits.value.findIndex((h) => h.id === habit.id)
    if (index !== -1) {
      userHabits.value[index].active = false
      saveUserHabits()
    }
  }

  function resumeHabit(habit) {
    if (!habit?.id) return

    const index = userHabits.value.findIndex((h) => h.id === habit.id)
    if (index !== -1) {
      userHabits.value[index].active = true
      saveUserHabits()
    }
  }

  function deleteHabit(habit) {
    if (!habit?.id) return

    const index = userHabits.value.findIndex((h) => h.id === habit.id)
    if (index !== -1) {
      userHabits.value.splice(index, 1)
      saveUserHabits()
    }
  }

  function refreshHabits() {
    isLoading.value = true
    try {
      habits.value = loadHabits()
      userHabits.value = loadUserHabits()
    } finally {
      isLoading.value = false
    }
  }

  // Batch operations for better performance
  function batchToggleHabits(habitIds, dateKey, completed) {
    if (!habits.value[dateKey]) {
      habits.value[dateKey] = []
    }

    if (completed) {
      // Add habits that aren't already completed
      habitIds.forEach(habitId => {
        if (!habits.value[dateKey].includes(habitId)) {
          habits.value[dateKey].push(habitId)
        }
      })
    } else {
      // Remove habits
      habits.value[dateKey] = habits.value[dateKey].filter(id => !habitIds.includes(id))
    }

    saveHabits()
  }

  // Cleanup function
  function cleanup() {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
  }

  // Auto-save on changes
  watch(userHabits, saveUserHabits, { deep: true })
  watch(habits, saveHabits, { deep: true })

  return {
    // State
    habits,
    userHabits,
    allHabits,
    activeHabits,
    inactiveHabits,
    isLoading,

    // Utility functions
    normalizeDate,
    formatDateKey,
    hasCompletionHistory,
    isHabitCompleted,
    toggleHabit,
    getCompletedHabits,

    // Habit management
    addHabit,
    updateHabit,
    stopHabit,
    resumeHabit,
    deleteHabit,
    refreshHabits,
    batchToggleHabits,
    cleanup,
  }
}
