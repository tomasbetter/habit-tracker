<template>
  <div class="habit-item" :class="{ inactive: !habit.active }">
    <div class="habit-content">
      <label :class="{ disabled: isFutureDate }">
        <input
          type="checkbox"
          :checked="isCompleted"
          @change="$emit('toggle', habit.id)"
          :disabled="isFutureDate"
        />
        {{ habit.name }}
      </label>

      <HabitActionMenu
        :show-menu="showMenu"
        :habit="habit"
        @close="$emit('close-menu')"
        @edit="$emit('edit', habit)"
        @stop="$emit('stop', habit)"
        @delete="$emit('delete', habit)"
      >
        <button
          class="action-button"
          @click="$emit('toggle-menu', habit.id)"
        >
          ⋮
        </button>
      </HabitActionMenu>
    </div>
  </div>
</template>

<script setup>
import HabitActionMenu from './HabitActionMenu.vue'

defineProps({
  habit: {
    type: Object,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isFutureDate: {
    type: Boolean,
    default: false
  },
  showMenu: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle', 'edit', 'stop', 'delete', 'toggle-menu', 'close-menu'])
</script>

<style scoped>
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
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
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
@media (width >= 768px) {
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
</style> 