<template>

  <p v-bind:style="{'display': inline === true ? 'inline' : 'block'}">
    {{ questionText }}&nbsp;
    <span v-for="(responseLabel, responseIdx) in iterList" v-bind:key="responseLabel">
      <time-entry
        v-model="response_parts[responseIdx]"
        v-if="textTypes[responseIdx] === 'time'"
        :question-text="responseLabel"
        @error-catch="updateAppState"
      ></time-entry>
      <textbox-question
        v-else
        v-model="response_parts[responseIdx]"
        :inline="true"
        :question-text="responseLabels != undefined ? responseLabel : ''"
        :unit="units[responseIdx]"
        :text-type="textTypes[responseIdx]"
        :min="responseRanges[responseIdx][0]"
        :max="responseRanges[responseIdx][1]"
        :question-position="responseLabelPosition"
        :box-size="boxSize"
        :display-units="displayUnits"
        @error-catch="updateAppState"></textbox-question>
      <span v-if="responseIdx != iterList.length - 1 && delimiter != ''">{{ delimiter }}&nbsp;</span>
    </span>

    <ul v-if="error_list.length > 0 && attempted === true" class="survey-error">
      <li v-for="errorMessage in error_list" class="survey-error" v-bind:key="errorMessage">{{ errorMessage }}</li>
    </ul>
  </p>
</template>

<script>

import textboxQuestion from './textbox-question.vue'
// import timeEntry from './time-entry.vue'


export default {
  name: 'textbox-multipart',
  props: {
    questionText: String,
    dataType: String,
    textTypes: Array,
    responseLabels: Array,
    responseLabelPosition: {
      type: String,
      default: "after"
    },
    responseRanges: {
      type: Array,
      default: () => { return [-Infinity, Infinity] }
    },
    inline: {
      type: Boolean,
      default: false
    },
    boxSize: {
      type: String,
      default: 'm'
    },
    delimiter: {
      type: String,
      default: ''
    },
    units: {
      type: Array,
      default: () => { return [] }
    },
    displayUnits: {
      type: Boolean,
      default: true
    }
  },
  components: {
    textboxQuestion,
    timeEntry: () => import('./time-entry.vue')
  },
  data: function() {
    return {
      response_parts: [],
      errors: {},
      error_list: [],
      attempted: false
    }
  },
  filters: {
    regularize: function (value) {
      return (this.regularize(value))
    }
  },
  methods: {
    regularize: function (value) {
      value = value.replace(" ", "-")
      value = value.replace(".", "")
      value = value.replace("?", "")
      value = value.replace(":", "")

      return (value)
    },
    updateAppState: function(namedErrors) {

      this.attempted = true;

      // process errors
      this.errors[namedErrors.element_name] = namedErrors.error_text
      this.error_list = []
      for (var element in this.errors) {
        for (var error in this.errors[element]) {
          if (typeof element != "string" || isNaN(element) || isNaN(parseFloat(element))) {
            this.error_list.push(element + ": " + this.errors[element][error])
          } else {
            this.error_list.push(this.errors[element][error])
          }
        }
      }

      // concatenate response_parts, according to what type of data this is
      var returned_value = {}
      var rl = this.responseLabels
      if (this.dataType == "height") {
        returned_value.text = this.response_parts.map(function(part, idx) {
          return( part + " " + rl[idx] )
        }).join(", ")
        returned_value.inches = this.response_parts[0] * 12 + this.response_parts[1]
      } else if (this.dataType == "time") {
        returned_value.hours = this.response_parts[0]
        returned_value.minutes = this.response_parts[1]
      } else {
        returned_value = this.response_parts;
      }

      this.$emit('input', returned_value);

      this.$emit('error-catch', {
        'element_name': this.regularize(this.questionText),
        'num_errors': this.error_list.length,
        'error_text': this.error_list
      });
    }
  },
  computed: {
    iterList: function() {
      if (this.units.length > 0 && this.responseLabels === undefined) {
        return this.units;
      } else {
        return this.responseLabels;
      }
    }
  },
  created: function() {

    // if we have only a min and max for all fields, use that correctly
    if (this.responseRanges[0].length == 1 && this.responseRanges.length == 1) {
      this.responseRanges = this.responseLabels.map(() => {
        return [this.responseRanges[0], [this.responseRanges[1]]]
      })
    }
  }
}
</script>
