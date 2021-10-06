<template>
  <loading-view v-if="submitting === true"></loading-view>
  <div v-else id="app">
    <h1>Experimenter Dashboard</h1>
    <div v-if="ppt_info != null">
      <div class="buttonbox">
        <button v-for="view_option in views.options"
          :key="view_option"
          :class="{
            'active' : views.current == view_option
          }"
          @click="views.current = view_option">
            {{ view_option }}
        </button>
      </div>

      <div v-if="views.current === 'this week only'">
        <span v-for="(ppt_data) in ppt_info_filtered"
          :key="'this-week-' + ppt_data.ppt_id">

          <participant-card
            :parent_ppt_data = "ppt_data"
            :available_tasks = "available_tasks[ppt_data.ppt_id]"
            @update="updatePptInfo"
          ></participant-card>

        </span>

      </div>
      <div v-else-if="views.current === 'all participants'">

        <span v-for="(ppt_data) in ppt_info_filtered_by_status['finished+no-show'].false"
          :key="'all-ppts-' + ppt_data.ppt_id">

          <participant-card
            :parent_ppt_data = "ppt_data"
            :available_tasks = "available_tasks[ppt_data.ppt_id]"
            @update="updatePptInfo"
          ></participant-card>

        </span>

          <h2>finished participants</h2>

            <span v-for="(ppt_data, ppt_id) in ppt_info_filtered_by_status['finished'].true"
              :key="'finished-' + ppt_id">
              <participant-card
                :parent_ppt_data = "ppt_data"
                :available_tasks = "available_tasks[ppt_data.ppt_id]"
                @update="updatePptInfo"
              ></participant-card>
            </span>

          <h2>no-shows</h2>

            <span v-for="(ppt_data, ppt_id) in ppt_info_filtered_by_status['no-show'].true"
              :key="'noshows-' +ppt_id">
              <participant-card
                :parent_ppt_data = "ppt_data"
                :available_tasks = "available_tasks[ppt_data.ppt_id]"
                @update="updatePptInfo"
              ></participant-card>
            </span>

      </div>
      <div v-else-if="views.current === 'bulk operations'">

        <button @click="notifyWaitingList">
          <span v-if="loading_elements.includes('notifyWaitingList')">
            notifying waiting list...
          </span>
          <span v-else>
            notify {{ waiting_list_length }} people on waitlist that new slots have opened
          </span>
        </button>

      </div>
      <div v-else-if="views.current === 'stats'">

        <div v-for="state in get_unique_ppt_attributes(ppt_info, 'state')" :key="state">
          <h1>{{ state }}: {{ filter_ppt_info_by_status(ppt_info, state, include=true).length }}</h1>
          <ul>
            <li v-for="cond in calc_cond_assigments_count(filter_ppt_info_by_status(ppt_info, state, include=true))" :key="cond['official_name']">
              {{ cond['official_name'] }}: {{ cond['count'] }}
            </li>
          </ul>
        </div>

      </div>
    </div>
    <div v-else>
      <textbox-question
        v-model="provided_pw"
        question-text="Please enter the password to access the dashboard:"
        :pw="true"
      ></textbox-question>

      <button v-on:click="login(provided_pw)">
        submit password
      </button>

      <ul class="survey-error" v-if="error_message != ''">
        <li>{{ error_message }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
// import eligibilitySurvey from './components/eligibility-survey.vue'
// import consentForm from './components/consent-form.vue'
import loadingView from './components/loading-view.vue'
import textboxQuestion from './components/form_parts/textbox-question.vue'
import participantCard from './components/ppt-card.vue'
// Initialize Cloud Functions through Firebase
import { fb_functions } from "./fb_init.js"

export default {
  name: 'ExperimenterDashboard',
  data: function() {
    return {
      'provided_pw': "",
      'views': {
        'current': 'this week only',
        'options': ['this week only', 'all participants', 'bulk operations', 'stats']
      },
      'exp_cond_defs':
        [
          {
            'official_name': 'language-similar',
            'db_name': 'coda'
          },
          {
            'official_name': 'language-dissimilar',
            'db_name': ['onset-onset', 'onset-coda']
          },
          {
            'official_name': 'training-similar',
            'db_name': 'onset-onset'
          },
          {
            'official_name': 'training-dissimilar',
            'db_name': 'onset-coda'
          }
      ],
      'submitting': false,
      'loading_elements': [],
      'loading_ppt': null,
      'ppt_info': null,
      'booked_appts': null,
      'waiting_list_length': 0,
      'tasks': [
        // {
        //   shortname: "fitbit",
        //   instruction: "set up Fitbit account"
        // },
        {
          shortname: "pickup",
          instruction: "confirm pick-up & send Day 1 email",
          state: "pickup",
          function: this.sendFirstEmail,
          color: 'green'
        },
        {
          shortname: "mark-noshow",
          instruction: "mark as no-show & cancel drop-off",
          state: "pickup",
          function: this.setAsNoShow,
          color: '#696969'
        },
        {
          shortname: "dropoff",
          instruction: "confirm dropoff",
          state: "dropoff",
          function: this.confirmDropoff,
          color: '#20B2AA'
        }
      ],
      'error_message': ''
    }
  },
  components: {
    textboxQuestion,
    loadingView,
    participantCard
  },
  methods: {
    taskClicked: function(value) {
      console.log(value)
    },
    getBookedTimeslots: fb_functions.httpsCallable('getBookedTimeslots'),
    checkPW: fb_functions.httpsCallable('checkExperimenterPW'),
    notifyWaitingList: function() {
      this.loading_elements.push('notifyWaitingList');

      let nwl = fb_functions.httpsCallable('notifyWaitingList');
      return nwl().then(() => {
        this.waiting_list_length = 0;
        this.loading_elements.pop();
      })
    },
    sendFirstEmail: function(ppt_id) {
      let sfe = fb_functions.httpsCallable('sendFirstEmail');
      return sfe({'participant_id': ppt_id})
    },
    confirmDropoff: function(ppt_id) {
      let cdo = fb_functions.httpsCallable('uploadData');
      return cdo({'participant_id': 'ppt/' + ppt_id,
                  'state': "finished"})
    },
    updatePptInfo: function(new_info) {
      this.$set(this.ppt_info, new_info.ppt_id, new_info);
      // console.log(former_ppt_info === this.ppt_info);
    },
    setAsNoShow: fb_functions.httpsCallable('setAsNoShow'),
    login: function (given_string) {

      this.submitting = true;

      return this.checkPW(given_string).then((response) => {

        if (typeof response.data === 'string' || response.data instanceof String) {
          // error
          this.error_message = response.data
          return 1;

        } else if (response.data === null) { // no participants in db yet
          this.ppt_info = {};
          return 0;

        } else {
          this.ppt_info = response.data

          // add other info to each participants ppt_info block
          this.ppt_info = Object.keys(this.ppt_info).map((ppt_id) => {
            return Object.assign(this.ppt_info[ppt_id], {'ppt_id': ppt_id})
          })

          // populate booked_appts
          let current_week_monday = new Date()
          current_week_monday.setDate(current_week_monday.getDate() - current_week_monday.getDay() + (current_week_monday.getDay() == 0 ? -6:1));
          let current_week_sunday = new Date()
          current_week_sunday.setDate(current_week_monday.getDate() + 6)
          console.log(current_week_monday);
          console.log(current_week_sunday);

          return this.getBookedTimeslots({
            minTime: current_week_monday.toISOString(),
            maxTime: current_week_sunday.toISOString()
          }).then((result) => {
            this.booked_appts = result.data;
            return;
          })
        }
      }).then(() => {
        // get number of people who are on the waitlist
        let gwl = fb_functions.httpsCallable('getWaitingListLength');
        return gwl()
      }).then((result) => {
        this.waiting_list_length = result.data;
        this.submitting = false;
      })
    },
    filter_ppt_info_by_status: function(list_to_filter, status_to_filter, include) {
      // status_to_filter = the critical status value, either as string or array if comparing many
      // include = whether you want to include only this status value (True) or exclude it (False)
      if (list_to_filter === null || Object.keys(list_to_filter).length === 0) {

        return [];

      } else {

        return list_to_filter.filter((ppt_data) => {

          let meets_criterion = null
          if (Array.isArray(status_to_filter)) {
            meets_criterion = status_to_filter.includes(ppt_data.state)
          } else {
            meets_criterion = status_to_filter === ppt_data.state
          }

          return (meets_criterion === include);
        })

      }

    },
    get_unique_ppt_attributes: function(ppt_list = this.ppt_info, attribute) {
      return Array.from(
        new Set(ppt_list.map(ppt => ppt[attribute]))
      )
    },
    calc_cond_assigments_count: function(ppt_list = this.ppt_info) {
      let result_list = this.exp_cond_defs.map(exp_cond_def => {
        let returned_obj = {'official_name': exp_cond_def['official_name']}

        if (Array.isArray(exp_cond_def['db_name'])) {
          returned_obj['count'] = exp_cond_def['db_name'].map(
            db_name => { return ppt_list.filter(ppt => ppt['exp_cond'] == db_name).length }
          ).reduce((a,b) => { return a + b })
        } else {
          returned_obj['count'] = ppt_list.filter(ppt => ppt['exp_cond'] == exp_cond_def['db_name']).length
        }

        // pull from exp_ver if we can
        if (returned_obj['count'] == 0) {
          if (returned_obj['official_name'].includes('language-')) {
            if (returned_obj['official_name'].includes('-dissimilar')) {
              returned_obj['count'] = ppt_list.filter(ppt => ppt['exp_ver'] == 4).length
            } else {
              returned_obj['count'] = ppt_list.filter(ppt => ppt['exp_ver'] == 2).length
            }
          } else {
            returned_obj['count'] = 'not set yet'
          }
        }

        return returned_obj

      })

      return result_list
    }
  },
  computed: {
    ppt_info_filtered_by_status: function() {
      return {
        'no-show': {
          'true': this.filter_ppt_info_by_status(this.ppt_info, 'no-show', true),
          'false': this.filter_ppt_info_by_status(this.ppt_info, 'no-show', false)
        },
        'finished': {
          'true': this.filter_ppt_info_by_status(this.ppt_info, 'finished', true),
          'false': this.filter_ppt_info_by_status(this.ppt_info, 'finished', false)
        },
        'finished+no-show': {
          'true': this.filter_ppt_info_by_status(this.ppt_info, ['finished', 'no-show'], true),
          'false': this.filter_ppt_info_by_status(this.ppt_info, ['finished', 'no-show'], false)
        }
      }

    },
    ppts_this_week: function() {
      if (this.booked_appts === null || this.ppt_info === {}) {
        return []
      } else {
        return this.booked_appts.map((item) => {
          return item.ppt_id;
        })
      }
    },
    ppt_info_filtered: function() {
      if (this.ppts_this_week === [] || this.ppt_info === null || Object.keys(this.ppt_info).length === 0) {
        return []
      } else {

        return this.ppt_info.filter((ppt_data) => {
          return this.ppts_this_week.includes(String(ppt_data.ppt_id));
        })
      }
    },
    available_tasks: function() {
      if (this.ppt_info === null || this.ppt_info === {}) {
        return []
      } else {

        return Object.keys(this.ppt_info).map((ppt_id) => {
          return this.tasks.filter((task) => {
            return task.state === this.ppt_info[ppt_id].state
          })
        })
      }
    }
  }
}
</script>

<style src="./assets/style.css"></style>
