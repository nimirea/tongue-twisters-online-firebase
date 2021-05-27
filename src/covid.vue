<template>
  <div id="app">
    <loading-view v-if="uploading === true || ppt_id === null"></loading-view>
    <div v-else-if="COVIDstatus === null">
      <h1>COVID-19 Symptom Pre-Screener</h1>
      <div v-for="(question, idx) in yesno_questions" :key="question">
        <p>{{ question }}</p>
        <radio-button-question
          v-model="answers[idx]"
          :group-id="idx + ''"
          @error-catch="updateFormErrors"
        ></radio-button-question>
      </div>

      <p>In the past 14 days, have you experienced any of the following symptoms? (Check all that apply.)</p>
      <checkbox-question
        v-model="answers.symptoms"
        :group-id="'symptoms'"
        :options="symptoms"
      ></checkbox-question>

      <button v-on:click="submitSurvey" v-if="perfectFormState === true">
        submit survey
      </button>
      <button v-else class="unclickable">
        please answer all questions to continue
      </button>
    </div>

    <div v-else-if="COVIDstatus === false">
      <h1>Thanks!</h1>
      <p>Your appointment is confirmed. We'll see you later today!</p>
    </div>
    <div v-else-if="COVIDstatus === true">
      <h1>Please reschedule your appointment.</h1>
      <p>For safety reasons, your appointment must be postponed. We will be reaching out to you soon to reschedule your appointment.</p>
    </div>

  </div>
</template>
<script>

// import eligibilitySurvey from './components/eligibility-survey.vue'
// import consentForm from './components/consent-form.vue'
// import booking from './components/booking.vue'
import radioButtonQuestion from './components/form_parts/radio-button-question.vue'
import checkboxQuestion from './components/form_parts/checkbox-question.vue'
import loadingView from './components/loading-view.vue'


// Initialize Cloud Functions through Firebase
import { fb_functions } from "./fb_init.js"

export default {
  name: 'covid-screener',
  components: {
    radioButtonQuestion,
    checkboxQuestion,
    loadingView
  },
  data: function() {
    return {
      yesno_questions: [
        'In the past 40 days, have you tested positive for COVID-19?',
        'Are you currently under investigation for COVID-19 and not yet aware if you tested positive or negative?',
        'In the past 14 days, were you or a member of your household advised to self-isolate for COVID-19 by government officials or healthcare providers?',
      ],
      symptoms: [
        'Fever or chills',
        'Mild or moderate difficulty breathing or shortness of breath',
        'New or worsening cough',
        'Sustained loss of smell, taste, or appetite',
        'Sore throat'
      ],
      perfectFormState: false,
      ppt_id: null,
      uploading: false,
      answers: {},
      errorCounts: {},
      COVIDstatus: null
    }
  },
  methods: {
    updateFormErrors: function(namedErrors) {

      // store data
      this.errorCounts[namedErrors['element_name']] = namedErrors['num_errors']

      // required questions
      if (
        this.answers[0] === undefined ||
        this.answers[1] === undefined ||
        this.answers[2] === undefined
      ) {
        this.perfectFormState = false
      } else {
        // set perfectFormState based on this
        var errorSum = Object.values(this.errorCounts).reduce((a,b) => a + b);
        this.perfectFormState = (errorSum === 0);
      }

    },
    submitSurvey: function() {
      this.uploading = true;
      var submitData = fb_functions.httpsCallable('checkCOVID');
      let self = this;

      return submitData({
        answers: this.answers,
        ppt_id: this.ppt_id,
        questions: this.yesno_questions
      }).then((returned_COVIDstatus) => {
        self.COVIDstatus = returned_COVIDstatus.data
        self.uploading = false
      })
    }
  },
  created: function() {
    var urlParams = new URLSearchParams(window.location.search);

    // grab participant ID from URL
    if (urlParams.has('ppt')) {
      this.ppt_id = urlParams.get('ppt')
    }

    return 0
  }
}

</script>
