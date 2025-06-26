<template>
  <div class="day-view">
    <DayNavigation :current-date="currentDate" />

    <HabitList
      :habits="allHabits"
      :completed-habits="completedHabits"
      :is-future-date="isFutureDate"
      @add-habit="showAddModal = true"
      @edit-habit="handleHabitEditStart"
      @stop-habit="handleHabitStop"
      @resume-habit="handleHabitResume"
      @delete-habit="handleHabitDelete"
      @toggle-habit="handleHabitToggle"
    />

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

    <AddHabitModal
      v-model="showAddModal"
      :existing-habits="allHabits.map((h) => h.name)"
      @habit-added="handleHabitAdded"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import DayNavigation from '../components/DayNavigation.vue'
import HabitList from '../components/HabitList.vue'
import AddHabitModal from '../components/AddHabitModal.vue'
import EditHabitModal from '../components/EditHabitModal.vue'
import { useHabitStore } from '../composables/useHabitStore'

// Props
const props = defineProps({
  date: {
    type: String,
    required: true
  }
})

const route = useRoute()

// Use the habit store composable
const {
  allHabits,
  normalizeDate,
  formatDateKey,
  toggleHabit,
  getCompletedHabits,
  addHabit,
  updateHabit,
  stopHabit,
  resumeHabit,
  deleteHabit,
  refreshHabits,
} = useHabitStore()

// Local state
const showAddModal = ref(false)
const showEditModal = ref(false)
const selectedHabit = ref(null)

// Computed properties - now using the prop directly
const currentDate = computed(() => {
  return normalizeDate(new Date(props.date))
})

const dateKey = computed(() => formatDateKey(currentDate.value))

const completedHabits = computed(() => getCompletedHabits(dateKey.value))

const isFutureDate = computed(() => {
  const today = normalizeDate(new Date())
  return currentDate.value.getTime() > today.getTime()
})

// Event handlers
function handleHabitAdded(habitName) {
  addHabit(habitName)
}

function handleHabitEditStart(habit) {
  selectedHabit.value = habit
  showEditModal.value = true
}

function handleHabitEdit(updatedHabit) {
  updateHabit(updatedHabit)
}

function handleHabitStop(habit) {
  stopHabit(habit)
}

function handleHabitResume(habit) {
  resumeHabit(habit)
}

function handleHabitDelete(habit) {
  deleteHabit(habit)
}

function handleHabitToggle(habitId) {
  toggleHabit(habitId, dateKey.value)
}

// Watch for route changes to refresh habits
watch(
  () => route.params.date,
  () => {
    refreshHabits()
  },
)
</script>

<style scoped>
.day-view {
  max-width: 100%;
  margin: 0 auto;
  padding: 8px;
}

/* Tablet and desktop styles */
@media (width >= 768px) {
  .day-view {
    max-width: 900px;
    padding: 30px;
  }
}
</style>
