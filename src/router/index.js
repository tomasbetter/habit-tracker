import { createRouter, createWebHistory } from 'vue-router'
import DayView from '../views/DayView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: () => {
        const today = new Date()
        const dateString = today.toISOString().split('T')[0]
        return `/day/${dateString}`
      }
    },
    {
      path: '/day/:date',
      name: 'day',
      component: DayView,
      beforeEnter: (to, from, next) => {
        const dateParam = to.params.date
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        
        if (!dateRegex.test(dateParam)) {
          next('/')
          return
        }

        const requestedDate = new Date(dateParam)
        if (isNaN(requestedDate.getTime())) {
          next('/')
          return
        }

        next()
      }
    }
  ],
})

export default router
