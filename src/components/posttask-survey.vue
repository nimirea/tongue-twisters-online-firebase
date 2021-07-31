<template>
<loading-view v-if="uploading === true"></loading-view>
<div v-else>
  <h2>Equipment</h2>

  <p>Which browser are you using?</p>
  <radio-button-question
    v-model="survey_answers.browser"
    group-id="browser"
    :labels="['Chrome','Firefox', 'Internet Explorer', 'Safari']"
    :other-option="true"
  ></radio-button-question>

  <p>Which operating system are you using?</p>
  <radio-button-question
    v-model="survey_answers.os"
    group-id="os"
    :labels="['Windows','Mac', 'Linux']"
    :other-option="true"
  ></radio-button-question>

  <p>What type of headphones did you use to complete the tongue-twister task?</p>
  <radio-button-question
    v-model="survey_answers.headphones"
    group-id="headphones"
    :labels="['Bluetooth headphones','Wired headphones', 'I did not use any headphones']"
    :values="['bt', 'wired', 'none']"
  ></radio-button-question>

  <p>When recording your voice, which microphone did you use?</p>
  <radio-button-question
    v-model="survey_answers.microphone"
    group-id="microphone"
    :labels="['Headphone microphone', 'Computer’s built-in microphone', 'Other external microphone']"
    :values="['headphone', 'built-in', 'external']"
  ></radio-button-question>

  <h2>Sleep</h2>

  <textbox-question
    v-model="survey_answers.lastNightSleep"
    question-text="How many hours of sleep did you get last night?"
    :min=0
    :max=24
    text-type="number"
    unit="hours"
    @error-catch="updateFormErrors"
  ></textbox-question>

  <p v-if="day > 1">Did you wear the Fitbit last night?</p>
  <radio-button-question v-if="day > 1"
    v-model="survey_answers.lastNightTracker"
    group-id="lastNightTracker"
    :labels="['Yes', 'No']"
  ></radio-button-question>

  <about-you v-if="day == 1" @error-catch="updateFormErrors" v-model="survey_answers.aboutyou"></about-you>

  <h2>Is there anything else you'd like us to know about your experience today?</h2>
  <textarea v-model="survey_answers.anything_else"></textarea>

  <button v-on:click="submitSurvey" v-if="perfectFormState === true">
    submit survey to
    <span v-if="day != exp_ver">receive tomorrow's link</span>
    <span v-else>continue</span>
  </button>
  <button v-else class="unclickable">
    please fix errors in form to continue
  </button>

</div>
</template>
<script>
import { fb_functions } from "../fb_init.js"

import textboxQuestion from './form_parts/textbox-question.vue'
import radioButtonQuestion from './form_parts/radio-button-question.vue'
import aboutYou from './about-you-survey.vue'
import loadingView from './loading-view.vue'

// import checkboxQuestion from './form_parts/checkbox-question.vue'

export default {
  name: 'post-task-survey',
  props: ['pptId', 'day', 'exp_ver'],
  components: {
    radioButtonQuestion,
    textboxQuestion,
    loadingView,
    aboutYou
  },
  data: function() {
    return {
      perfectFormState: true,
      survey_answers: {},
      errorCounts: {},
      uploading: false
    }
  },
  methods: {
    uploadData: fb_functions.httpsCallable('uploadData'),
    submitSurvey: function() {
      this.uploading = true;
      let self = this;

      this.uploadData({
        'participant_id': 'ppt/' + this.pptId,
        'day': this.day,
        'postTaskSurvey': this.survey_answers,
        'timestamp_name': 'completionTime'
      }).then(() => {
        self.$emit('submit');
        self.uploading = false;
      })
    },
    updateFormErrors: function(namedErrors) {

      // store data
      this.errorCounts[namedErrors['element_name']] = namedErrors['num_errors']

      // set perfectFormState based on this
      var errorSum = Object.values(this.errorCounts).reduce((a,b) => a + b);
      this.perfectFormState = (errorSum === 0);
    }
  }
}
</script>
