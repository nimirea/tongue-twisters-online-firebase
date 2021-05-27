<template>
  <loading-view v-if="uploading === true"></loading-view>
  <div v-else-if="!surveyComplete">
    <h1>Screening Survey</h1>

    <h2>Demographics</h2>

    <p>What is your native language?</p>
    <radio-button-question
      v-model="survey_answers.native_lang"
      group-id="native_lang"
      @error-catch="updateFormErrors"
      :labels="['English', 'other']"
    ></radio-button-question>

    <p>Do you have any history of speech, language, hearing, and/or sleep disorder?</p>
    <radio-button-question
      v-model="survey_answers.disorder"
      group-id="disorder"
      @error-catch="updateFormErrors"
      :labels="['Yes', 'No']"
    ></radio-button-question>

    <p>Are you 18 years of age or older?</p>
    <radio-button-question
      v-model="survey_answers.age18orolder"
      group-id="age18orolder"
      @error-catch="updateFormErrors"
      :labels="['Yes', 'No']"
    ></radio-button-question>

    <h2>Equipment</h2>

    <p>What type(s) of headphones do you have access to? (check all that apply)</p>
    <checkbox-question
      group-id="headphones"
      v-model="survey_answers.headphones"
    ></checkbox-question>

    <p>What type(s) of microphone do you have access to? (check all that apply)</p>

    <checkbox-question
      group-id="microphones"
      v-model="survey_answers.microphones"
      :options="[
        'Computer\'s built-in microphone',
        'Microphone on Bluetooth headphones',
        'Microphone on wired headphones',
        'Standalone USB microphone'
      ]"
    ></checkbox-question>

    <h2>Availability</h2>

    <p>If you choose to take part in our study, you may be asked to log into our online experiment at the same time every day for 4 weekdays in a row, for 30 minutes each day. For example, if you choose to start the study at 10am on March 15, you will be asked to log in on March 16, March 17, and March 18 at 10am:</p>

    <img src="../assets/calendar.png" />

    <p><b>Can you be available for 30 minutes at the same time, for four weekdays in a row, starting within the next month (in exchange for up to $40 total compensation)?</b></p>

    <radio-button-question
      v-model="survey_answers.available_4"
      group-id="available_4"
      @error-catch="updateFormErrors"
      v-bind:labels="['Yes, I can be available for 4 weekdays in a row','No, I cannot be available for 4 weekdays in a row']"
      :values="['yes', 'no']"
    ></radio-button-question>

    <p>There is a 1 in 3 chance that you will be asked to log in to our online experiment at the same time for 2 days in a row instead, for 30 minutes each day. This will be determined randomly, like the roll of a dice, and neither you nor the experimenter will have control over whether you will be asked to log in for two days or four days. <b>Can you be available for 30 minutes at the same time, for <i>two</i> weekdays in a row, starting within the next month (in exchange for up to $20 total compensation)?</b></p>

    <radio-button-question
      v-model="survey_answers.available_2"
      group-id="available_2"
      @error-catch="updateFormErrors"
      v-bind:labels="['Yes, I can be available for 2 weekdays in a row','No, I cannot be available for 2 weekdays in a row']"
      :values="['yes', 'no']"
    ></radio-button-question>

    <h2>Contact</h2>
    <textbox-question
      v-model="survey_answers.email"
      @error-catch="updateFormErrors"
      question-text="Please enter your email address, so we can contact you if you are eligible:"
      text-type="email"
    ></textbox-question>

    <p>(If you are not eligible, your email address will not be stored.)</p>

    <button v-on:click="submitSurvey" v-if="perfectFormState === true">
      submit survey
    </button>
    <button v-else class="unclickable">
      please answer all questions to continue
    </button>
  </div>
  <div v-else>
    <div v-if="returned_data.is_eligible && returned_data.waiting_list === false">
      <h1>Congratulations!</h1>
      <p>You are eligible to participate in the {{ returned_data.study_length }}-day version of our study.</p>
      <p>You should receive an email with a link to our consent form and instructions on how to pick up and drop off your equipment on campus. If you have not received this email in one hour, please contact the research team at <a href="mailto:multinight.study@gmail.com">multinight.study@gmail.com</a>.</p>
    </div>
    <div v-else-if="returned_data.is_eligible && returned_data.waiting_list === true">
      <h1>You're eligible, but the study is full right now</h1>
      <p>You are eligible to participate in the {{ returned_data.study_length }}-day version of our study, but we do not have any open timeslots right now. We will email you when more spots open up!</p>
    </div>
    <div v-else>
      <h1>Thank you for your response</h1>
      <p>You are not eligible to participate in our study at this time.</p>
    </div>
  </div>
</template>
<script>
import { fb_functions } from "../fb_init.js"

import textboxQuestion from './form_parts/textbox-question.vue'
import radioButtonQuestion from './form_parts/radio-button-question.vue'
import checkboxQuestion from './form_parts/checkbox-question.vue'
import loadingView from './loading-view.vue'

export default {
  name: 'eligibility-survey',
  props: ['firebase'],
  components: {
    radioButtonQuestion,
    checkboxQuestion,
    textboxQuestion,
    loadingView
  },
  data: function() {
    return {
      survey_answers: {},
      perfectFormState: false,
      errorCounts: [],
      surveyComplete: false,
      returned_data: {},
      uploading: false
    }
  },
  methods: {
    updateFormErrors: function(namedErrors) {

      // store data
      this.errorCounts[namedErrors['element_name']] = namedErrors['num_errors']

      // check for completeness, for fields that should be complete
      if (
        this.survey_answers.email == null ||
        this.survey_answers.available_2 == null ||
        this.survey_answers.available_4 == null ||
        this.survey_answers.age18orolder == null ||
        this.survey_answers.native_lang == null ||
        this.survey_answers.disorder == null
      ) {
        this.perfectFormState = false
      } else {
        // set perfectFormState based on this
        var errorSum = Object.values(this.errorCounts).reduce((a,b) => a + b);
        this.perfectFormState = (errorSum === 0);
      }
    },
    submitSurvey: function() {

      this.uploading = true
      let self = this;

      // upload to server
      var submitData = fb_functions.httpsCallable('submitData');

      submitData(this.survey_answers).then((res) => {
        self.uploading = false
        if (res.data !== null) {
          self.returned_data = res.data;
          self.surveyComplete = true;
        } else {
          self.perfectFormState = false;
        }
      });
    }
  },
  created: function() {
  }
}

</script>
