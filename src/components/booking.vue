<template>
  <loading-view v-if="uploading === true"></loading-view>
  <div v-else-if="state === 'not tried' && study_full === false">
    <h1 v-if="rescheduling">Rescheduling Your Appointments</h1>
    <h1 v-else>Set-up Survey</h1>

    <h2>Book <span v-if="rescheduling">new </span>pick-up/drop-off appointments</h2>

    <p>Please book appointments to pick up and drop off your equipment. Drop-off options will appear after you have selected a pick-up time and drop-off appointments must be within five days of your pick-up appointment.</p>

    <p>All appointments will take place {{ location_name }}.</p>

    <h3>Pick-up options</h3>

    <loading-view v-if="available_timeslots.length === 0" :page-view="false"></loading-view>
    <radio-button-question v-else
      :labels = "pickup_times.labels"
      :values = "pickup_times.values"
      :group-id = "'pickup'"
      v-model="appointment_choices.pickup"
      @error-catch="updateFormErrors"
    ></radio-button-question>

    <h3>Drop-off options</h3>

    <p v-if="Object.keys(dropoff_times).length === 0">
      (Options will appear here after you have selected a pick-up time above.)
    </p>
    <radio-button-question v-else
      :labels = "dropoff_times.labels"
      :values = "dropoff_times.values"
      :group-id = "'dropoff'"
      v-model="appointment_choices.dropoff"
      @error-catch="updateFormErrors"
    ></radio-button-question>

    <div v-if="!rescheduling">
      <h2>Demographics</h2>

      <p>Your answers to these questions will help us calibrate your activity monitor for improved accuracy.
        You do <b>not</b> need to reply to any of these questions in order to participate in the study.</p>

      <textbox-question question-text="age:"
        unit="years old"
        v-model="form_answers.age"
        :min="18"
        text-type="number"
        @error-catch="updateFormErrors"></textbox-question>
      <textbox-multipart question-text="height:"
        v-model="form_answers.height"
        :text-types="['integer', 'number']"
        :response-labels="['feet', 'inch(es)']"
        :response-ranges="[[1, 9], [0, 11.99]]"
        data-type="height"
        @error-catch="updateFormErrors"></textbox-multipart>
      <textbox-question question-text="weight:"
        unit="lbs."
        v-model="form_answers.weight"
        :min="0"
        text-type="number"
        @error-catch="updateFormErrors"></textbox-question>
      <textbox-question
        question-text="gender:"
        v-model="form_answers.gender"
        @error-catch="updateFormErrors"></textbox-question>
    </div>

    <p v-if="rescheduling">
      Please note: any previous appointments will be cancelled.
    </p>

    <button v-on:click="submitSurvey" v-if="perfectFormState === true">
      submit survey
    </button>
    <button v-else class="unclickable">
      please answer all required questions to continue
    </button>
  </div>
  <div v-else-if="state === 'not tried' && study_full === true">
    <h1>The study is full!</h1>
    <p>We do not have any open timeslots right now. We will email you when more spots open up!</p>
  </div>
  <div v-else-if="state==='try again'">
    <h1>Please try again</h1>
    <p>We couldn't book your appointments because of a conflict on the calendar.
      Please choose again:</p>

      <h3>Pick-up options</h3>

      <radio-button-question
        :labels = "pickup_times.labels"
        :values = "pickup_times.values"
        :group-id = "'pickup'"
        v-model="appointment_choices.pickup"
        @error-catch="updateFormErrors"
      ></radio-button-question>

      <h3>Drop-off options</h3>

      <p v-if="Object.keys(dropoff_times).length === 0">
        (Options will appear here after you have selected a pick-up time above.)
      </p>
      <radio-button-question v-else
        :labels = "dropoff_times.labels"
        :values = "dropoff_times.values"
        :group-id = "'dropoff'"
        v-model="appointment_choices.dropoff"
        @error-catch="updateFormErrors"
      ></radio-button-question>

      <button v-on:click="submitSurvey" v-if="perfectFormState === true">
        submit survey
      </button>
      <button v-else class="unclickable">
        please answer all required questions to continue
      </button>
  </div>
  <div v-else>
    <h1>You're all set up!</h1>
    <p>You should receive email confirmation of your appointments shortly.</p>
    <p>Note: on the morning before your appointment, you will receive a link to a COVID screening survey. Please fill out this survey before your appointment.</p>
  </div>
</template>
<script>

import { fb_functions } from "../fb_init.js"
import radioButtonQuestion from './form_parts/radio-button-question.vue'
import textboxQuestion from './form_parts/textbox-question.vue'
import textboxMultipart from './form_parts/textbox-multipart.vue'
import loadingView from './loading-view.vue'

export default {
  name: 'booking',
  props: ['pptId', 'rescheduling'],
  components: {
    radioButtonQuestion,
    textboxQuestion,
    textboxMultipart,
    loadingView
  },
  data: function() {
    return {
      perfectFormState: false,
      state: "not tried",
      form_answers: {},
      errorCounts: [],
      available_timeslots: [],
      appointment_choices: {
        pickup: undefined,
        dropoff: undefined
      },
      uploading: false,
      study_full: false,
      location_name: null
    }
  },
  methods: {
    bookAppts: fb_functions.httpsCallable('bookAppts'),
    uploadData: fb_functions.httpsCallable('uploadData'),
    updateFormErrors: function(namedErrors) {
      this.errorCounts[namedErrors['element_name']] = namedErrors['num_errors'];

      if (
        this.appointment_choices.pickup == null ||
        this.appointment_choices.dropoff == null
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
      let self = this;

      var appt_data = {
        'participant_id': this.pptId,
        'rescheduling': this.rescheduling
      }
      Object.keys(this.appointment_choices).forEach((appt_type) => {
        appt_data[appt_type] = this.available_timeslots[this.appointment_choices[appt_type]]
      })

      // first, upload form data
      this.uploadData(
        {
          'participant_id': this.pptId,
          'demographics': this.form_answers,
          'state': 'pickup'
        }
      ).then(() => {
        return this.bookAppts(appt_data)
      }).then((response) => {
        self.uploading = false;
        console.log(response)

        if (response.data === 0) {
          this.state = "completed";
        } else {
          this.state = "try again";
          this.loadApptOptions(); // reload available options
          this.appointment_choices = {
            pickup: undefined,
            dropoff: undefined
          }
          this.perfectFormState = false;
        }
      })
    },
    filterApptOptions: function(desired_day, desired_week) {
      let return_obj = {
        'labels': [],
        'values': []
      }

      this.available_timeslots.forEach((timeslot, idx) => {
        if (timeslot.dayOfWeek === desired_day && (desired_week === undefined || timeslot.week == desired_week)) {
          return_obj.labels.push(timeslot.label)
          return_obj.values.push(idx)
        }
      })

      return(return_obj)
    },
    loadApptOptions: function() {
      let gat = fb_functions.httpsCallable('getAvailableTimeslots')
      gat().then((res) => {
        this.available_timeslots = res.data;
        if (this.pickup_times.values.length === 0 || this.available_timeslots.length === 0) {
          this.study_full = true;
          let atwl = fb_functions.httpsCallable('addToWaitingList')
          atwl(this.pptId)
        }
      })
    },
    loadApptLocation: function() {
      let gal = fb_functions.httpsCallable('getApptLoc')
      gal().then((res) => {
        this.location_name = res.data;
      })
    }
  },
  computed: {
    pickup_times: function() {
      return this.filterApptOptions("Monday")
    },
    dropoff_times: function() {
      if (this.appointment_choices.pickup === undefined) {
        return {}
      } else {
        return this.filterApptOptions("Friday", this.available_timeslots[this.appointment_choices.pickup].week)
      }
    }
  },
  created: function() {
    this.loadApptLocation();
    this.loadApptOptions();
  }
}

</script>
