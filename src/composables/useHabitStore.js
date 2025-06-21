import { ref, computed } from 'vue'

export function useHabitStore() {
  const habits = ref(loadHabits())
  const userHabits = ref(loadUserHabits())

  // Load functions
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

  // Save functions
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

  // Computed properties
  const allHabits = computed(() => {
    return userHabits.value.filter(
      (habit) => habit.active || hasCompletionHistory(habit.id),
    )
  })

  // Utility functions
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

  function hasCompletionHistory(habitId, dateKey) {
    return habits.value[dateKey]?.includes(habitId) || false
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

  // Habit management functions
  function addHabit(habitName) {
    userHabits.value.push({
      id: habitName.toLowerCase().replace(/\s+/g, '-'),
      name: habitName,
      active: true,
      isDefault: false,
    })
    saveUserHabits(userHabits.value)
  }

  function updateHabit(updatedHabit) {
    const index = userHabits.value.findIndex((h) => h.id === updatedHabit.id)
    if (index !== -1) {
      userHabits.value[index] = updatedHabit
      saveUserHabits(userHabits.value)
    }
  }

  function stopHabit(habit) {
    const index = userHabits.value.findIndex((h) => h.id === habit.id)
    if (index !== -1) {
      userHabits.value[index].active = false
      saveUserHabits(userHabits.value)
    }
  }

  function deleteHabit(habit) {
    const index = userHabits.value.findIndex((h) => h.id === habit.id)
    if (index !== -1) {
      userHabits.value.splice(index, 1)
      saveUserHabits(userHabits.value)
    }
  }

  function refreshHabits() {
    habits.value = loadHabits()
  }

  return {
    // State
    habits,
    userHabits,
    allHabits,

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
    deleteHabit,
    refreshHabits,
  }
}
