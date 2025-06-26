import { createRouter, createWebHistory } from 'vue-router'
import DayView from '../views/DayView.vue'

// Utility functions for date validation and formatting
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function isValidDateString(dateString) {
  return DATE_REGEX.test(dateString)
}

function isValidDate(date) {
  return !isNaN(date.getTime())
}

function formatDateForRoute(date) {
  return date.toISOString().split('T')[0]
}

function getTodayRoute() {
  return `/day/${formatDateForRoute(new Date())}`
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: getTodayRoute,
    },
    {
      path: '/day/:date',
      name: 'day',
      component: DayView,
      props: (route) => ({ 
        date: route.params.date 
      }),
      beforeEnter: (to, from, next) => {
        const { date } = to.params
        
        // Quick validation check
        if (!isValidDateString(date)) {
          next(getTodayRoute())
          return
        }

        // Validate the actual date
        const requestedDate = new Date(date)
        if (!isValidDate(requestedDate)) {
          next(getTodayRoute())
          return
        }

        // Optional: Add reasonable date range limits
        const today = new Date()
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
        const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
        
        if (requestedDate < oneYearAgo || requestedDate > oneYearFromNow) {
          next(getTodayRoute())
          return
        }

        next()
      },
    },
    // Catch-all route for 404s
    {
      path: '/:pathMatch(.*)*',
      redirect: getTodayRoute,
    },
  ],
})

export default router
