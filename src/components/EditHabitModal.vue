<template>
  <div v-if="modelValue" class="modal-overlay" @click="closeModal">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>Edit Habit</h2>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="habitName">Habit Name</label>
            <input
              type="text"
              id="habitName"
              v-model="habitName"
              ref="habitNameInput"
              :class="{ 'error': error }"
              placeholder="Enter habit name"
              @input="error = ''"
            >
            <div v-if="error" class="error-message">{{ error }}</div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
            <button type="submit" class="btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick } from 'vue'

export default {
  name: 'EditHabitModal',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    habit: {
      type: Object,
      required: true
    },
    existingHabits: {
      type: Array,
      required: true
    }
  },
  emits: ['update:modelValue', 'habit-updated'],
  setup(props, { emit }) {
    const habitName = ref('')
    const error = ref('')
    const habitNameInput = ref(null)

    watch(() => props.modelValue, (newVal) => {
      if (newVal) {
        habitName.value = props.habit.name
        nextTick(() => {
          habitNameInput.value?.focus()
        })
      }
    })

    const closeModal = () => {
      habitName.value = ''
      error.value = ''
      emit('update:modelValue', false)
    }

    const handleSubmit = () => {
      const name = habitName.value.trim()
      
      if (!name) {
        error.value = 'Habit name is required'
        return
      }
      
      const otherHabits = props.existingHabits.filter(h => h !== props.habit.name)
      if (otherHabits.includes(name)) {
        error.value = 'This habit name already exists'
        return
      }
      
      emit('habit-updated', { ...props.habit, name })
      closeModal()
    }

    return {
      habitName,
      error,
      habitNameInput,
      closeModal,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 95%;
  margin: 10px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: modal-appear 0.3s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  position: sticky;
  top: 0;
  background: white;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0.5rem;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
}

.close-button:hover {
  color: #333;
}

.modal-body {
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 1rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 44px;
}

.form-group input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.form-group input.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.modal-footer {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column-reverse;
  gap: 0.75rem;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  border: none;
  min-height: 44px;
  width: 100%;
  touch-action: manipulation;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e9e9e9;
}

/* Tablet and desktop styles */
@media (min-width: 768px) {
  .modal {
    width: 90%;
    max-width: 500px;
    margin: 0;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-header h2 {
    font-size: 1.5rem;
  }

  .modal-footer {
    flex-direction: row;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .btn-primary, .btn-secondary {
    width: auto;
    padding: 0.5rem 1rem;
  }
}
</style>
