<template>
  <div class="lang-entry">
    <textbox-question
      v-model="answers.name"
      question-text="Language Name:"
    ></textbox-question>
    <ul>
      <li>
        <textbox-question
          v-model="answers.age_began"
          question-text="At what age did you begin learning this language? (enter 0 if this is your first language)"
          text-type="number"
          unit="years old"
          box-size="s"
          @error-catch="updateFormErrors"
        ></textbox-question>
      </li>
      <li>
        <textbox-question
          v-model="answers.years_studied"
          question-text="How long have you studied/spoken this language? "
          text-type="number"
          unit="years"
          box-size="s"
          @error-catch="updateFormErrors"
        ></textbox-question>
      </li>
    </ul>
  </div>
</template>
<script>
import textboxQuestion from './textbox-question.vue'

export default {
  name: 'lang-entry',
  components: {
    textboxQuestion
  },
  data: function() {
    return {
      'answers': {}
    }
  },
  methods: {
    updateFormErrors: function(namedErrors) {
      this.$emit('error-catch', namedErrors);
    }
  },
  watch: {
    answers: function(val) {
      this.$emit('input', val);
    }
  }
}

</script>
