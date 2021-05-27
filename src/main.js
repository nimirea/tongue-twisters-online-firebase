import Vue from 'vue'
import PreExp from './pre_exp.vue'
import ExperimenterDashboard from './ED.vue'
import ExperimentSession from './exp.vue'
import CovidScreener from './covid.vue'

Vue.config.productionTip = false

const NotFound = { template: '<p>Page not found</p>' }

const routes = {
  '/': PreExp,
  '/experimenter': ExperimenterDashboard,
  '/session': ExperimentSession,
  '/covid-screener': CovidScreener
}

new Vue({
  el: '#app',
  data: {
    currentRoute: window.location.pathname
  },
  computed: {
    ViewComponent () {
      return routes[this.currentRoute] || NotFound
    }
  },
  render (h) { return h(this.ViewComponent) }
})
