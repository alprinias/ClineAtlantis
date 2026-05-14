import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import AdminView from './components/AdminView.js'
import RecruitmentView from './components/RecruitmentView.js'
import OperationsView from './components/OperationsView.js'
import RotationPlanView from './components/RotationPlanView.js'

const app = {
  components: {
    AdminView,
    RecruitmentView,
    OperationsView,
    RotationPlanView,
  },
  data() {
    return {
      currentView: '',
    }
  },
  computed: {
    currentViewComponent() {
      return this.currentView || null
    },
  },
  methods: {
    setView(viewName) {
      this.currentView = viewName
    },
  },
}

createApp(app).mount('#app')
