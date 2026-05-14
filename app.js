import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

const app = {
  data() {
    return {
      title: 'Vue 3 GitHub Pages Mock',
      subtitle: 'This demo uses separate HTML, CSS, and JS files so you can evolve it later.',
      status: 'Ready',
      count: 0,
    }
  },
  methods: {
    toggleStatus() {
      this.status = this.status === 'Ready' ? 'Updated' : 'Ready'
    },
    increment() {
      this.count += 1
    },
    reset() {
      this.count = 0
      this.status = 'Ready'
    },
  },
}

createApp(app).mount('#app')
