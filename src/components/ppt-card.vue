<template>
  <div class="ppt-ed-solo" :class="{'ppt-inactive': ppt_data.state === 'finished' || ppt_data.state === 'no-show'}">
    <p class="ppt-ed-title">Participant #{{ ppt_data.ppt_id }}</p>
      <ul>
        <li>email: <a :href="'mailto:' + ppt_data.email">{{ppt_data.email}}</a></li>
        <li>status: {{ ppt_data.state }}</li>
        <li>
          earnings: <b>${{ ppt_data.cash_earned }}</b>
        </li>
        <li>COVID Screening:
          <span :class="['covid-screen-results', ppt_data.COVIDscreeningStatus.tag]">
            {{ ppt_data.COVIDscreeningStatus.text }}
          </span>
        </li>
        <li v-if="'note' in ppt_data">note: {{ ppt_data.note }}</li>
        <li v-if="extractComments(ppt_data) !== null">Post-task comments:
          <ul>
            <li v-for="comment in extractComments(ppt_data)" :key="comment">{{ comment }}</li>
          </ul>
        </li>
      </ul>
      <div class="buttonbox" v-if="loading_ppt === false">
        <button v-for="task in available_tasks"
          :key="'this-week-' + ppt_data.ppt_id + '-' + task.shortname"
          :style="{'background-color': task.color}"
          @click="functionHandler(task.function, ppt_data.ppt_id)">
            {{ task.instruction }}
        </button>
      </div>
      <loading-view :page-view="false" v-else></loading-view>
  </div>
</template>
<script>

import loadingView from './loading-view.vue'

export default {
  name: 'participantCard',
  props: ['parent_ppt_data', 'available_tasks'],
  components: {
    loadingView
  },
  data: function() {
    return {
      'loading_ppt': false,
      'received_ppt_data': null,
      'compensation': [
        7,
        9,
        11,
        13
      ]
    }
  },
  methods: {
    functionHandler: function(function_to_run, argument) {
      this.loading_ppt = true;
      if (typeof function_to_run === "function") {
        return function_to_run(argument).then((result) => {
          this.loading_ppt = false;
          this.received_ppt_data = result.data;
        })
      } else {
        return null;
      }
    },
    lessThan24HoursAgo: function(timestamp) {
      // check if a timestamp is less than 24 hours ago
      var datetime = new Date(timestamp).getTime()
      var now = new Date().getTime()

      var milisec_diff = now - datetime

      if (milisec_diff < 0 || milisec_diff > 1000 * 60 * 60 * 24) {
        return false
      } else {
        return true
      }
    },
    getCOVIDscreeningStatus: function(ppt_data) {
      let result = "passed"

      if (Object.keys(ppt_data).includes('lastCOVIDscreen') == false || this.lessThan24HoursAgo(ppt_data.lastCOVIDscreen.time) === false ) {
        result = "not completed"
      } else if (ppt_data.lastCOVIDscreen.result === true) {
        result = "failed"
      }

      return {
        text: result,
        tag: result.replace(' ', '-')
      };
    },
    calcCashEarned: function(ppt_data) {
      // calculate cash earned according to schedule
      let compensation_sched = this.compensation;
      if (ppt_data.exp_ver == 2) {
        compensation_sched = [compensation_sched[0], compensation_sched[compensation_sched.length - 1]]
      }

      // how many of these have they actually done?
      let num_sessions_done = 0
      if ('completionTime' in ppt_data) {
        num_sessions_done = ppt_data.completionTime.filter((val) => { return val != null }).length
      }

      if (num_sessions_done === 0) {
        return 0;
      } else {
        let sessions_done = compensation_sched.slice(0, num_sessions_done)

        // sum the total
        return sessions_done.reduce((a, b) => {
          return a + b
        })
      }
    },
    extractComments: function(ppt_data) {
      let result = []
      if ('postTaskSurvey' in ppt_data) {

        for (let day in ppt_data.postTaskSurvey) {
          if (ppt_data.postTaskSurvey[day] !== null && 'anything_else' in ppt_data.postTaskSurvey[day]) {
            result.push("Day " + day + ": " + ppt_data.postTaskSurvey[day].anything_else)
          }
        }
      }

      if (result.length === 0) {
        return null;
      } else {
        return result;
      }
    }
  },
  computed: {
    'ppt_data': function() {

      let source_data = this.parent_ppt_data

      if (this.received_ppt_data !== null) {
        source_data = this.received_ppt_data
      }

      let additional_info = {
        'ppt_id': this.parent_ppt_data.ppt_id,
        'cash_earned': this.calcCashEarned(source_data),
        'COVIDscreeningStatus': this.getCOVIDscreeningStatus(source_data)
      }
      let result = Object.assign(source_data, additional_info);

      if (this.received_ppt_data !== null) {
        this.$emit('update', result); // percolate results up to the parent element
      }

      return result;

    }
  }
}
</script>
