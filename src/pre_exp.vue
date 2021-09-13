<template>
  <div id="app">
    <eligibility-survey v-if="ppt_state === 'eligibility-survey'"></eligibility-survey>
    <consent-form v-else-if="ppt_state === 'consent-form' || requested === 'consent_record'" :ppt-id="ppt_id" :record="requested === 'consent_record'" @finished="refreshState"></consent-form>
    <booking v-else-if="ppt_state === 'appointment-booking' || ppt_state === 'pickup'" :ppt-id="ppt_id" :rescheduling="ppt_state === 'pickup'"></booking>
    <loading-view v-else></loading-view>
  </div>
</template>

<script>
import eligibilitySurvey from './components/eligibility-survey.vue'
import consentForm from './components/consent-form.vue'
import booking from './components/booking.vue'
import loadingView from './components/loading-view.vue'
// Initialize Cloud Functions through Firebase
import { fb_functions } from "./fb_init.js"

export default {
  name: 'PreExp',
  data: function() {
    return {
      ppt_state: null,
      ppt_id: null,
      requested: 'study_setup'
    }
  },
  components: {
    eligibilitySurvey,
    consentForm,
    booking,
    loadingView
  },
  methods: {
    getData: fb_functions.httpsCallable('getPptData'),
    refreshState: function(ppt_id, change_ppt_id = false) {

      if (change_ppt_id) {
        this.ppt_id = ppt_id
      }

      return this.getData({ppt_id: ppt_id, attribute: 'state'}).then((res) => {
        if (Object.prototype.toString.call(res.data) === '[object Object]' && Object.keys(res.data).includes('new_ppt_id')) {
          this.ppt_id = res.data.new_ppt_id
          this.ppt_state = res.data.state
        } else {
          this.ppt_state = res.data
        }
      })

    }
  },
  created: function() {
    // query database to get participant's state
    var urlParams = new URLSearchParams(window.location.search);

    console.log(urlParams.has('ppt'))

    // set participant state based on URL parameters
    if (urlParams.has('email')) {

      this.ppt_id = 'email/' + urlParams.get('email').replaceAll(" ", "+").replaceAll(".", "|")
      this.refreshState(this.ppt_id)

    } else if (urlParams.has('ppt')) {

      this.ppt_id = 'ppt/' + urlParams.get('ppt')
      this.refreshState(this.ppt_id)

    } else {

      // entry point
      this.ppt_state = "eligibility-survey"

    }

    // set requested page based on URL parameters
    if (urlParams.has('page')) {
      this.requested = urlParams.get('page');
    }

  }
}
</script>

<style src="./assets/style.css"></style>
