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
      <button class="add-habit-btn" @click="showAddModal = true">
        + Add Habit
      </button>
    </div>

    <div class="habit-list">
      <div 
        v-for="habit in allHabits" 
        :key="habit.id" 
        class="habit-item"
        :class="{ 'inactive': !habit.active }"
      >
        <div class="habit-content">
          <label :class="{ disabled: isFutureDate }">
            <input 
              type="checkbox" 
              :checked="isHabitCompleted(habit.id)"
              @change="toggleHabit(habit.id)"
              :disabled="isFutureDate"
            >
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
        :existing-habits="allHabits.map(h => h.name)"
        @habit-updated="handleHabitEdit"
        @update:modelValue="val => { if (!val) selectedHabit = null }"
      />
    </div>

    <AddHabitModal
      v-model="showAddModal"
      :existing-habits="allHabits.map(h => h.name)"
      @habit-added="handleHabitAdded"
    />

    <div v-if="isFutureDate" class="future-date-message">
      Cannot mark habits for future dates
    </div>
  </div>
</template>

<script>
import AddHabitModal from '../components/AddHabitModal.vue'
import EditHabitModal from '../components/EditHabitModal.vue'
import HabitActionMenu from '../components/HabitActionMenu.vue'

export default {
  name: 'DayView',
  components: {
    AddHabitModal,
    EditHabitModal,
    HabitActionMenu
  },
  data() {
    return {
      showAddModal: false,
      showEditModal: false,
      selectedHabit: null,
      showMenuForHabit: null,
      habits: this.loadHabits(),
      userHabits: this.loadUserHabits(),
      defaultHabits: this.loadDefaultHabits(),
      windowWidth: window.innerWidth
    }
  },
  computed: {
    allHabits() {
      return [...this.defaultHabits, ...this.userHabits].filter(habit => 
        habit.active || this.hasCompletionHistory(habit.id)
      );
    },
    currentDate() {
      const dateParam = this.$route.params.date;
      const date = dateParam ? new Date(dateParam) : new Date();
      return this.normalizeDate(date);
    },
    formatCurrentDate() {
      return this.currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    isFutureDate() {
      const today = this.normalizeDate(new Date());
      return this.currentDate.getTime() > today.getTime();
    },
    dateKey() {
      return this.formatDateKey(this.currentDate);
    },
    currentMonthYear() {
      return this.currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    },
    weekOffsets() {
      const offsets = [];
      for (let i = -3; i <= 3; i++) {
        offsets.push(i);
      }
      return offsets;
    },
    isDesktop() {
      return this.windowWidth >= 768;
    }
  },
  methods: {
    normalizeDate(date) {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    },
    formatDateKey(date) {
      // Use local timezone instead of UTC to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    migrateDefaultHabitsToUserHabits(defaultHabits) {
      const userHabits = this.loadUserHabits();
      const existingIds = new Set(userHabits.map(h => h.id));
      
      defaultHabits.forEach(habit => {
        if (!existingIds.has(habit.id)) {
          userHabits.push({
            ...habit,
            deletable: true
          });
        }
      });
      
      this.saveUserHabits(userHabits);
    },
    loadDefaultHabits() {
      const stored = localStorage.getItem('defaultHabits');
      if (stored) {
        const defaultHabits = JSON.parse(stored);
        // Migrate existing default habits to user habits for backwards compatibility
        if (defaultHabits.length > 0) {
          this.migrateDefaultHabitsToUserHabits(defaultHabits);
          // Clear default habits from localStorage
          localStorage.removeItem('defaultHabits');
        }
        return [];
      }
      
      // No initial default habits - all habits are user-created and deletable
      return [];
    },
    saveDefaultHabits() {
      localStorage.setItem('defaultHabits', JSON.stringify(this.defaultHabits));
    },
    loadHabits() {
      const stored = localStorage.getItem('habits');
      return stored ? JSON.parse(stored) : {};
    },
    loadUserHabits() {
      const stored = localStorage.getItem('userHabits');
      if (!stored) return [];
      
      const data = JSON.parse(stored);
      // Handle both old format (array of names) and new format (array of objects)
      return Array.isArray(data) ? 
        data.map(item => {
          if (typeof item === 'string') {
            return {
              id: item.toLowerCase().replace(/\s+/g, '-'),
              name: item,
              active: true,
              isDefault: false
            };
          }
          return item;
        }) : [];
    },
    saveUserHabits(habits) {
      const habitData = habits.map(habit => ({
        id: habit.id,
        name: habit.name,
        active: habit.active,
        isDefault: habit.isDefault
      }));
      localStorage.setItem('userHabits', JSON.stringify(habitData));
    },
    handleHabitAdded(habitName) {
      this.userHabits.push({
        id: habitName.toLowerCase().replace(/\s+/g, '-'),
        name: habitName,
        active: true,
        isDefault: false
      });
      this.saveUserHabits(this.userHabits);
    },
    hasCompletionHistory(habitId) {
      return Object.values(this.habits).some(dayData => habitId in dayData);
    },
    handleHabitEditStart(habit) {
      this.selectedHabit = habit;
      this.showEditModal = true;
      this.showMenuForHabit = null;
    },
    handleHabitEdit(updatedHabit) {
      if (updatedHabit.isDefault) {
        const habit = this.defaultHabits.find(h => h.id === updatedHabit.id);
        if (habit) {
          habit.name = updatedHabit.name;
          this.saveDefaultHabits();
        }
      } else {
        const habit = this.userHabits.find(h => h.id === updatedHabit.id);
        if (habit) {
          habit.name = updatedHabit.name;
          this.saveUserHabits(this.userHabits);
        }
      }
      this.showEditModal = false;
      this.selectedHabit = null;
    },
    handleHabitStop(habit) {
      if (habit.isDefault) {
        const defaultHabit = this.defaultHabits.find(h => h.id === habit.id);
        if (defaultHabit) {
          defaultHabit.active = !defaultHabit.active;
          this.saveDefaultHabits();
        }
      } else {
        const userHabit = this.userHabits.find(h => h.id === habit.id);
        if (userHabit) {
          userHabit.active = !userHabit.active;
          this.saveUserHabits(this.userHabits);
        }
      }
      this.showMenuForHabit = null;
    },
    handleHabitDelete(habit) {
      if (habit.isDefault) {
        // Remove from default habits
        this.defaultHabits = this.defaultHabits.filter(h => h.id !== habit.id);
        this.saveDefaultHabits();
      } else {
        // Remove from user habits
        this.userHabits = this.userHabits.filter(h => h.id !== habit.id);
        this.saveUserHabits(this.userHabits);
      }
      
      // Remove all completion records for this habit
      Object.keys(this.habits).forEach(date => {
        if (this.habits[date][habit.id]) {
          delete this.habits[date][habit.id];
          if (Object.keys(this.habits[date]).length === 0) {
            delete this.habits[date];
          }
        }
      });
      this.saveHabits();
      this.showMenuForHabit = null;
    },
    saveHabits() {
      localStorage.setItem('habits', JSON.stringify(this.habits));
    },
    isHabitCompleted(habitId) {
      return this.habits[this.dateKey]?.[habitId] || false;
    },
    toggleHabit(habitId) {
      if (this.isFutureDate) return;
      
      if (!this.habits[this.dateKey]) {
        this.habits[this.dateKey] = {};
      }
      
      this.habits[this.dateKey][habitId] = !this.isHabitCompleted(habitId);
      this.saveHabits();
    },
    navigateToDay(daysOffset) {
      const date = new Date(this.currentDate);
      date.setDate(date.getDate() + daysOffset);
      const dateString = this.formatDateKey(date);
      this.$router.push(`/day/${dateString}`);
    },
    isActiveDay(daysOffset) {
      return daysOffset === 0;
    },
    formatDayButton(daysOffset) {
      const date = new Date(this.currentDate);
      date.setDate(date.getDate() + daysOffset);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      if (this.normalizeDate(date).getTime() === this.normalizeDate(today).getTime()) {
        return 'Today';
      }
      if (this.normalizeDate(date).getTime() === this.normalizeDate(yesterday).getTime()) {
        return this.isDesktop ? 'Yesterday' : 'Yest';
      }
      
      if (this.isDesktop) {
        // Full format for desktop
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'numeric',
          day: 'numeric'
        });
      } else {
        // Very compact format for mobile
        const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
        const day = date.getDate();
        
        // Use format like "M4", "T5", "W6" for mobile
        return `${weekday.charAt(0)}${day}`;
      }
    },
    navigateMonth(monthsAgo) {
      const date = new Date(this.currentDate);
      date.setMonth(this.currentDate.getMonth() + monthsAgo);
      const dateString = this.formatDateKey(date);
      this.$router.push(`/day/${dateString}`);
    },
    goToToday() {
      const today = new Date();
      const dateString = this.formatDateKey(today);
      this.$router.push(`/day/${dateString}`);
    },
    navigateWeeks(weeksAgo) {
      const date = new Date(this.currentDate);
      date.setDate(this.currentDate.getDate() + weeksAgo * 7);
      const dateString = this.formatDateKey(date);
      this.$router.push(`/day/${dateString}`);
    }
  },
  watch: {
    '$route.params.date': {
      handler() {
        this.habits = this.loadHabits();
      },
      immediate: true
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    handleResize() {
      this.windowWidth = window.innerWidth;
    },
    normalizeDate(date) {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    },
    formatDateKey(date) {
      // Use local timezone instead of UTC to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    migrateDefaultHabitsToUserHabits(defaultHabits) {
      const userHabits = this.loadUserHabits();
      const existingIds = new Set(userHabits.map(h => h.id));
      
      defaultHabits.forEach(habit => {
        if (!existingIds.has(habit.id)) {
          userHabits.push({
            ...habit,
            deletable: true
          });
        }
      });
      
      this.saveUserHabits(userHabits);
    },
    loadDefaultHabits() {
      const stored = localStorage.getItem('defaultHabits');
      if (stored) {
        const defaultHabits = JSON.parse(stored);
        // Migrate existing default habits to user habits for backwards compatibility
        if (defaultHabits.length > 0) {
          this.migrateDefaultHabitsToUserHabits(defaultHabits);
          // Clear default habits from localStorage
          localStorage.removeItem('defaultHabits');
        }
        return [];
      }
      
      // No initial default habits - all habits are user-created and deletable
      return [];
    },
    saveDefaultHabits() {
      localStorage.setItem('defaultHabits', JSON.stringify(this.defaultHabits));
    },
    loadHabits() {
      const stored = localStorage.getItem('habits');
      return stored ? JSON.parse(stored) : {};
    },
    loadUserHabits() {
      const stored = localStorage.getItem('userHabits');
      if (!stored) return [];
      
      const data = JSON.parse(stored);
      // Handle both old format (array of names) and new format (array of objects)
      return Array.isArray(data) ? 
        data.map(item => {
          if (typeof item === 'string') {
            return {
              id: item.toLowerCase().replace(/\s+/g, '-'),
              name: item,
              active: true,
              isDefault: false
            };
          }
          return item;
        }) : [];
    },
    saveUserHabits(habits) {
      const habitData = habits.map(habit => ({
        id: habit.id,
        name: habit.name,
        active: habit.active,
        isDefault: habit.isDefault
      }));
      localStorage.setItem('userHabits', JSON.stringify(habitData));
    },
    handleHabitAdded(habitName) {
      this.userHabits.push({
        id: habitName.toLowerCase().replace(/\s+/g, '-'),
        name: habitName,
        active: true,
        isDefault: false
      });
      this.saveUserHabits(this.userHabits);
    },
    hasCompletionHistory(habitId) {
      return Object.values(this.habits).some(dayData => habitId in dayData);
    },
    handleHabitEditStart(habit) {
      this.selectedHabit = habit;
      this.showEditModal = true;
      this.showMenuForHabit = null;
    },
    handleHabitEdit(updatedHabit) {
      if (updatedHabit.isDefault) {
        const habit = this.defaultHabits.find(h => h.id === updatedHabit.id);
        if (habit) {
          habit.name = updatedHabit.name;
          this.saveDefaultHabits();
        }
      } else {
        const habit = this.userHabits.find(h => h.id === updatedHabit.id);
        if (habit) {
          habit.name = updatedHabit.name;
          this.saveUserHabits(this.userHabits);
        }
      }
      this.showEditModal = false;
      this.selectedHabit = null;
    },
    handleHabitStop(habit) {
      if (habit.isDefault) {
        const defaultHabit = this.defaultHabits.find(h => h.id === habit.id);
        if (defaultHabit) {
          defaultHabit.active = !defaultHabit.active;
          this.saveDefaultHabits();
        }
      } else {
        const userHabit = this.userHabits.find(h => h.id === habit.id);
        if (userHabit) {
          userHabit.active = !userHabit.active;
          this.saveUserHabits(this.userHabits);
        }
      }
      this.showMenuForHabit = null;
    },
    handleHabitDelete(habit) {
      if (habit.isDefault) {
        // Remove from default habits
        this.defaultHabits = this.defaultHabits.filter(h => h.id !== habit.id);
        this.saveDefaultHabits();
      } else {
        // Remove from user habits
        this.userHabits = this.userHabits.filter(h => h.id !== habit.id);
        this.saveUserHabits(this.userHabits);
      }
      
      // Remove all completion records for this habit
      Object.keys(this.habits).forEach(date => {
        if (this.habits[date][habit.id]) {
          delete this.habits[date][habit.id];
          if (Object.keys(this.habits[date]).length === 0) {
            delete this.habits[date];
          }
        }
      });
      this.saveHabits();
      this.showMenuForHabit = null;
    },
    saveHabits() {
      localStorage.setItem('habits', JSON.stringify(this.habits));
    },
    isHabitCompleted(habitId) {
      return this.habits[this.dateKey]?.[habitId] || false;
    },
    toggleHabit(habitId) {
      if (this.isFutureDate) return;
      
      if (!this.habits[this.dateKey]) {
        this.habits[this.dateKey] = {};
      }
      
      this.habits[this.dateKey][habitId] = !this.isHabitCompleted(habitId);
      this.saveHabits();
    },
    navigateToDay(daysOffset) {
      const date = new Date(this.currentDate);
      date.setDate(date.getDate() + daysOffset);
      const dateString = this.formatDateKey(date);
      this.$router.push(`/day/${dateString}`);
    },
    isActiveDay(daysOffset) {
      return daysOffset === 0;
    },
    formatDayButton(daysOffset) {
      const date = new Date(this.currentDate);
      date.setDate(date.getDate() + daysOffset);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      if (this.normalizeDate(date).getTime() === this.normalizeDate(today).getTime()) {
        return 'Today';
      }
      if (this.normalizeDate(date).getTime() === this.normalizeDate(yesterday).getTime()) {
        return this.isDesktop ? 'Yesterday' : 'Yest';
      }
      
      if (this.isDesktop) {
        // Full format for desktop
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'numeric',
          day: 'numeric'
        });
      } else {
        // Very compact format for mobile
        const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
        const day = date.getDate();
        
        // Use format like "M4", "T5", "W6" for mobile
        return `${weekday.charAt(0)}${day}`;
      }
    },
    navigateMonth(monthsAgo) {
      const date = new Date(this.currentDate);
      date.setMonth(this.currentDate.getMonth() + monthsAgo);
      const dateString = this.formatDateKey(date);
      this.$router.push(`/day/${dateString}`);
    },
    goToToday() {
      const today = new Date();
      const dateString = this.formatDateKey(today);
      this.$router.push(`/day/${dateString}`);
    },
    navigateWeeks(weeksAgo) {
      const date = new Date(this.currentDate);
      date.setDate(this.currentDate.getDate() + weeksAgo * 7);
      const dateString = this.formatDateKey(date);
      this.$router.push(`/day/${dateString}`);
    }
  }
}
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
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
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
  background-color: #4CAF50;
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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

.habit-item input[type="checkbox"] {
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

  .habit-item input[type="checkbox"] {
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
