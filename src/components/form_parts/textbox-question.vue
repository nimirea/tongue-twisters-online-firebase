<template>
  <p v-bind:class="{'inline-textbox': inline}">
    <label v-if="questionPosition == 'before' && questionText != ''" :for="regularize(questionText)">{{ questionText }}&nbsp;</label>
    <input
      :type="pw ? 'password' : 'text'"
      :id = "regularize(questionText)"
      v-on:input="updateAppState($event.target.value)"
      @focus="$emit('focus')"
      :class="something_entered === true? 'filled-out' : ''"
      :style="{width: boxSize === 's' ? '3rem' : 'default'}"/>
    &nbsp;<span v-if="displayUnits === true && unit != ''">{{ unit }}</span>
    <label v-if="questionPosition == 'after'" :for="regularize(questionText)">&nbsp;{{ questionText }}</label>
    &nbsp;

    <ul v-if="inline == false && errors.length > 0 && attempted === true" class="survey-error">
      <li v-for="errorMessage in errors" class="survey-error" v-bind:key="errorMessage">{{ errorMessage }}</li>
    </ul>
  </p>
</template>

<script>

export default {
  name: 'textbox-question',
  props: {
    questionText: String,
    textType: String,
    unit: {     // displayed after textbox
      type: String,
      default: ""
    },
    questionPosition: {     // whether to display question text before or after textbox
      type: String,
      default: "before"
    },
    inline: {
      type: Boolean,
      default: false
    },
    max: {
      type: Number,
      default: Infinity
    },
    min: {
      type: Number,
      default: -Infinity
    },
    pw: {
      type: Boolean,
      default: false
    },
    boxSize: {
      type: String,
      default: 'm'
    },
    displayUnits: {
      type: Boolean,
      default: true
    }
  },
  data: function() {
    return {
      errors: [],
      attempted: false,
      something_entered: false
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
    updateAppState: function(newValue) {

      this.something_entered = (newValue != "" && newValue != null)

      // officially attempted
      this.attempted = true;

      this.errors = []

      // check for valid answers, depending on the type of text we're dealing with
      if (newValue != "") {
        if (this.textType == "email") {
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue) === false) {
            this.errors.push("must be a valid email");
          }
        } else if (this.textType == "number") {
          if (newValue != "" && (isNaN(newValue) || isNaN(parseFloat(newValue)))) {
             this.errors.push("must be a number");
           }
        } else if (this.textType == "integer") {
          if (newValue != "" && (isNaN(newValue) || isNaN(parseFloat(newValue)))) {
             this.errors.push("must be a number");
           } else if (parseFloat(newValue) !== parseInt(newValue, 10)) {
             this.errors.push("must be a whole number")
           }
        }

        // too high or too low errors
        if ((this.textType == "number" || this.textType == "integer") && !this.errors.includes("not a number")) {
          newValue = parseFloat(newValue)
          if (newValue > this.max) {
            this.errors.push("value too high")
          } else if (newValue < this.min) {
            this.errors.push("value too low")
          }
        }
      }

      this.$emit('input', newValue);

      this.$emit('error-catch', {
        'element_name': this.regularize(this.questionText),
        'num_errors': this.errors.length,
        'error_text': this.errors
      });
    }
  }
}
</script>
