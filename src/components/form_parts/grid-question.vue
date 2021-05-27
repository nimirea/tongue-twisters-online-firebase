<template>
  <div class="grid-question">
    <p v-for="(question, q_idx) in questions" v-bind:key="q_idx">
      <span class="question" v-if="typeof(question) === 'string'">{{question}}</span>
      <span class="question" v-else>{{ question.question }}</span>
      <!-- <span class="question">{{ typeof(question) }}</span> -->
      <radio-button-question
        v-model="answers[q_idx]"
        :labels="options_by_question[q_idx]"
        :inline="true"
        ></radio-button-question>
    </p>
  </div>
</template>
<script>
import radioButtonQuestion from './radio-button-question.vue';

export default {
  name: 'grid-question',
  components: {
    radioButtonQuestion
  },
  props: {
    questions: Array,
    options: {
      type: Array,
      default: () => {
        return ([
          'Never',
          'Rarely',
          'Some-times',
          'Often',
          'Mostly',
          'Always'
        ])
      }
    },
    options_descriptions: {
      type: Array,
      default: () => {
        return ([
          '',
          'A few times per year',
          'Several times per month',
          '1-2 times per week',
          '3-4 times per week',
          '5 times or more per week',
          ''
        ])
      }
    }
  },
  data: function() {
    return {
      'answers': {},
      'options_and_descriptions': [],
      'options_by_question': []
    }
  },
  watch: {
    answers: function(val) {
      this.$emit('input', val);
    }
  },
  created: function() {
    (this.options).forEach((element, idx) => {
      let addition = ""
      if (this.options_descriptions[idx] != "") {
        addition = " (" + this.options_descriptions[idx] + ")";
      }

      this.options_and_descriptions.push(element + addition);
    });

    (this.questions).forEach((element) => {
      var options_for_this_question = this.options_and_descriptions.slice(0);
      if (typeof(element) != 'string') {
        console.log(typeof(element));
        options_for_this_question.push(element.additional_answer)
      }

      this.options_by_question.push(options_for_this_question);
    })
  }
}
</script>
