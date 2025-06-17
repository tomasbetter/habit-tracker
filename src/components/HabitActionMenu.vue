<template>
  <div class="action-menu-container">
    <slot></slot>
    <Teleport to="body">
      <div v-if="showMenu" class="menu-overlay" @click="close"></div>
    </Teleport>
    <div v-if="showMenu" class="menu-content" ref="menuRef">
      <button class="menu-item" @click="$emit('edit')">
        <span class="icon">✏️</span>
        Edit
      </button>
      <button class="menu-item" @click="handleStop">
        <span class="icon">⏸️</span>
        {{ habit.active ? 'Stop' : 'Resume' }}
      </button>
      <button class="menu-item delete" @click="handleDelete">
        <span class="icon">🗑️</span>
        Delete
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'

export default {
  name: 'HabitActionMenu',
  props: {
    showMenu: {
      type: Boolean,
      required: true,
    },
    habit: {
      type: Object,
      required: true,
    },
  },
  emits: ['close', 'edit', 'stop', 'delete'],
  setup(props, { emit }) {
    const menuRef = ref(null)

    const close = () => emit('close')

    const handleStop = () => {
      if (
        confirm(
          props.habit.active
            ? 'Are you sure you want to stop tracking this habit?'
            : 'Do you want to resume tracking this habit?',
        )
      ) {
        emit('stop')
        close()
      }
    }

    const handleDelete = () => {
      if (
        confirm(
          'Are you sure you want to delete this habit? This will remove all tracking history.',
        )
      ) {
        emit('delete')
        close()
      }
    }

    const handleClickOutside = (event) => {
      if (!props.showMenu) return

      const isClickOnButton = event.target.closest('.action-button')
      const isClickInMenu = menuRef.value?.contains(event.target)

      if (!isClickOnButton && !isClickInMenu) {
        close()
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      menuRef,
      close,
      handleStop,
      handleDelete,
    }
  },
}
</script>

<style scoped>
.action-menu-container {
  position: relative;
  display: inline-block;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.1);
  z-index: 999;
}

.menu-content {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  min-width: 180px;
  padding: 4px 0;
  z-index: 1000;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 1rem;
  color: #333;
  transition: background-color 0.2s;
  min-height: 44px;
  touch-action: manipulation;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-item:active {
  background-color: #e9e9e9;
}

.menu-item.delete {
  color: #dc3545;
}

.menu-item.delete:hover {
  background-color: #fff5f5;
}

.menu-item.delete:active {
  background-color: #ffe5e5;
}

.icon {
  font-size: 1.2em;
  width: 24px;
  text-align: center;
}

/* Tablet and desktop styles */
@media (min-width: 768px) {
  .menu-content {
    min-width: 150px;
    padding: 8px 0;
  }

  .menu-item {
    padding: 8px 16px;
    min-height: 36px;
    font-size: 0.9rem;
  }

  .icon {
    width: 20px;
  }
}
</style>
