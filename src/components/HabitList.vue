<template>
  <div class="habit-list-container">
    <div class="habit-list-header">
      <h2>My Habits</h2>
      <button class="add-habit-btn" @click="$emit('add-habit')">+ Add Habit</button>
    </div>

    <div class="habit-list">
      <HabitItem
        v-for="habit in habits"
        :key="habit.id"
        :habit="habit"
        :is-completed="isHabitCompleted(habit.id)"
        :is-future-date="isFutureDate"
        :show-menu="showMenuForHabit === habit.id"
        @toggle="toggleHabit"
        @edit="handleHabitEditStart"
        @stop="handleHabitStop"
        @delete="handleHabitDelete"
        @toggle-menu="toggleMenu"
        @close-menu="showMenuForHabit = null"
      />
    </div>

    <div v-if="isFutureDate" class="future-date-message">
      Cannot mark habits for future dates
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import HabitItem from './HabitItem.vue'

const props = defineProps({
  habits: {
    type: Array,
    required: true
  },
  completedHabits: {
    type: Array,
    default: () => []
  },
  isFutureDate: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['add-habit', 'edit-habit', 'stop-habit', 'delete-habit', 'toggle-habit'])

const showMenuForHabit = ref(null)

function isHabitCompleted(habitId) {
  return props.completedHabits.includes(habitId)
}

function toggleHabit(habitId) {
  emit('toggle-habit', habitId)
}

function handleHabitEditStart(habit) {
  emit('edit-habit', habit)
}

function handleHabitStop(habit) {
  emit('stop-habit', habit)
}

function handleHabitDelete(habit) {
  emit('delete-habit', habit)
}

function toggleMenu(habitId) {
  showMenuForHabit.value = showMenuForHabit.value === habitId ? null : habitId
}
</script>

<style scoped>
.habit-list-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
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

.habit-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
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

/* Tablet and desktop styles */
@media (width >= 768px) {
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
</style> 