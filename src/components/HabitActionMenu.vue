<template>
  <div class="action-menu-container" ref="containerRef">
    <slot></slot>
    <Teleport to="body">
      <div v-if="showMenu" class="menu-overlay" @click="close"></div>
    </Teleport>
    <Teleport to="body">
      <div 
        v-if="showMenu" 
        class="menu-content" 
        ref="menuRef"
        :style="menuStyle"
      >
        <button class="menu-item" @click="$emit('edit')">
          <span class="icon">✏️</span>
          Edit
        </button>
        <button class="menu-item" @click="handleStopResume">
          <span class="icon">⏸️</span>
          {{ habit.active ? 'Stop' : 'Resume' }}
        </button>
        <button class="menu-item delete" @click="handleDelete">
          <span class="icon">🗑️</span>
          Delete
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  showMenu: {
    type: Boolean,
    required: true,
  },
  habit: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close', 'edit', 'stop', 'resume', 'delete'])

const menuRef = ref(null)
const containerRef = ref(null)

const close = () => emit('close')

const menuStyle = computed(() => {
  if (!props.showMenu || !containerRef.value) return {}
  
  const rect = containerRef.value.getBoundingClientRect()
  const menuHeight = 150 // Approximate height of the menu
  const menuWidth = 180 // Approximate width of the menu
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top
  
  // Check if menu would overflow below
  const shouldPositionAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow
  
  // Calculate top position with bounds checking
  let topPosition
  if (shouldPositionAbove) {
    topPosition = Math.max(4, rect.top - menuHeight - 4)
  } else {
    topPosition = Math.min(viewportHeight - menuHeight - 4, rect.bottom + 4)
  }
  
  // Calculate right position with bounds checking
  const rightPosition = Math.max(4, Math.min(viewportWidth - menuWidth - 4, window.innerWidth - rect.right))
  
  return {
    position: 'fixed',
    top: `${topPosition}px`,
    right: `${rightPosition}px`,
  }
})

const handleStopResume = () => {
  if (
    confirm(
      props.habit.active
        ? 'Are you sure you want to stop tracking this habit?'
        : 'Do you want to resume tracking this habit?',
    )
  ) {
    if (props.habit.active) {
      emit('stop')
    } else {
      emit('resume')
    }
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
</script>

<style scoped>
.action-menu-container {
  position: relative;
  display: inline-block;
}

.menu-overlay {
  position: fixed;
  inset: 0;
  background-color: rgb(0 0 0 / 10%);
  z-index: 1000;
}

.menu-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 25%);
  min-width: 180px;
  padding: 4px 0;
  z-index: 1001;
  border: 1px solid #e0e0e0;
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
@media (width >= 768px) {
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
