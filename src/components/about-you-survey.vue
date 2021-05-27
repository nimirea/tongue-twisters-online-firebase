<template>
  <div>
  <h2>About You (Day 1 only)</h2>

  <h3>Language Background</h3>

  <p> Do you speak any other languages besides English? If so, list them here:

  <ul>
    <li v-for="(lang, lang_idx) in answers.other_langs" :key="lang_idx">
      <lang-entry v-model="answers.other_langs[lang_idx]" @error-catch="updateFormErrors"></lang-entry>
    </li>
    <li><span class="add-lang" @click="addLang">+ click to add another language</span></li>
  </ul>



  <h3>Sleep Habits</h3>

  <textbox-multipart question-text="How much sleep do you need per day (24 hour period?)"
    v-model="answers.ksq.q1"
    :text-types="['integer', 'integer']"
    :response-labels="['hours', 'minute(s)']"
    :response-ranges="[[0, 24], [0, 59]]"
    data-type="time"
    @error-catch="updateFormErrors"></textbox-multipart>

  <p>To what extent do you consider yourself a morning-type or evening-type of person?</p>
  <radio-button-question
    v-model="answers.ksq.q2"
    :group-id="'ksq-2'"
    :labels="[
      'pronounced morning type (alert in the morning, tired in the evening)',
      'to some extent morning type',
      'to some extent evening type',
      'pronounced evening type (tired in the morning, alert in the evening)'
    ]"
    :values="[
      'pronounced-morning',
      'tosomeextent-morning',
      'tosomeextent-evening',
      'pronounced-evening'
    ]"></radio-button-question>

    <p>When do you usually wake up and when do you go to bed?</p>

    <ul>
      <li>Work days:
          <textbox-multipart question-text=""
            v-model="answers.ksq.q3_work_1"
            :text-types="['time', 'time']"
            :response-labels="['Go to bed (put the lights out) at', 'and wake up at']"
            :response-label-position="'before'"
            @error-catch="updateFormErrors"></textbox-multipart>
          <textbox-question question-text="Time before falling asleep (after putting the lights out)?"
            v-model="answers.ksq.q3_work_2"
            :text-type="'integer'"
            :unit="'minutes'"
            @error-catch="updateFormErrors"></textbox-question>
          <textbox-multipart question-text=""
            v-model="answers.ksq.q3_work_3"
            :text-types="['time', 'time']"
            :response-labels="['Regular nap from', 'until']"
            :response-label-position="'before'"
            @error-catch="updateFormErrors"></textbox-multipart>
      </li>
      <li>Off days:
        <textbox-multipart question-text=""
          v-model="answers.ksq.q3_off_1"
          :text-types="['time', 'time']"
          :response-labels="['Go to bed (put the lights out) at', 'and wake up at']"
          :response-label-position="'before'"
          @error-catch="updateFormErrors"></textbox-multipart>
        <textbox-question question-text="Time before falling asleep (after putting the lights out)?"
          v-model="answers.ksq.q3_off_2"
          :text-type="'integer'"
          :unit="'minutes'"
          @error-catch="updateFormErrors"></textbox-question>
        <textbox-multipart question-text=""
          v-model="answers.ksq.q3_off_3"
          :text-types="['time', 'time']"
          :response-labels="['Regular nap from', 'until']"
          :response-label-position="'before'"
          @error-catch="updateFormErrors"></textbox-multipart>
      </li>
    </ul>

    <p>Do you get enough sleep?</p>
    <radio-button-question
      v-model="answers.ksq.q4_a"
      :labels="[
        'yes, definitely enough',
        'yes, almost enough',
        'no, slightly too little',
        'no, clearly too little',
        'no, far from enough'
      ]"></radio-button-question>

    <p>If your sleep is insufficient, why do you think that is?</p>
    <textarea v-model="answers.ksq.q4_b"></textarea>

    <p>Generally speaking, how is your sleep?</p>
    <radio-button-question
      v-model="answers.ksq.q5"
      :labels="[
        'very good',
        'fairly good',
        'neither good nor poor',
        'fairly poor',
        'very poor'
      ]"></radio-button-question>

    <p>Apart from your sleep, do you get enough rest?</p>
    <radio-button-question
      v-model="answers.ksq.q6"
      :labels="[
        'yes, definitely enough',
        'yes, almost enough',
        'no, slightly too little',
        'no, clearly too little',
        'no, far from enough'
      ]"></radio-button-question>

    <p>How often do you get enough rest between your work shifts?</p>
    <radio-button-question
      v-model="answers.ksq.q7"
      :labels="[
        'generally between all work shifts',
        'between a few work shifts per week',
        'between a few work shifts per month',
        'between a few work shifts per year',
        'never'
      ]"></radio-button-question>

    <p>How often do you get enough rest during periods off work?</p>
    <radio-button-question
      v-model="answers.ksq.q8"
      :labels="[
        'generally during all periods off work',
        'most of the periods off work',
        'a few periods off work per month',
        'a few periods off work per year',
        'never'
      ]"></radio-button-question>

    <p>Have you experienced any of the following complaints the past three months?</p>
    <grid-question
      v-model="answers.ksq.q9"
      :questions="[
        'Difficulties falling asleep',
        'Difficulties waking up',
        'Repeated awakenings with difficulties going back to sleep',
        'Heavy snoring',
        {
          question: 'Heavy snoring',
          additional_answer: 'Do not know'
        },
        {
          question: 'Gasping for breath during sleep',
          additional_answer: 'Do not know'
        },
        {
          question: 'Cessation of breathing during sleep',
          additional_answer: 'Do not know'
        },
        'Nightmares',
        'Not feeling refreshed when waking up',
        'Premature awakening',
        'Disturbed/restless sleep',
        'Feeling exhausted when waking up',
        'Sleepiness during work',
        'Sleepiness during leisure time',
        'Unintentional dozing off during work',
        'Unintentional dozing off during leisure time',
        'Having to fight off sleep to stay awake',
        'Mental fatigue during daytime'
      ]"
    ></grid-question>

    <p>How often do you sleep 5 hours or less per day?</p>
    <radio-button-question
      v-model="answers.ksq.q10"
      :labels="[
        'Never',
        'Rarely (A few times per year)',
        'Sometimes (Several times per month)',
        'Often (1-2 times per week)',
        'Mostly (3-4 times per week)',
        'Always (5 times or more per week)'
      ]"></radio-button-question>

    <p>How often do you sleep 9 hours or more per day?</p>
    <radio-button-question
      v-model="answers.ksq.q11"
      :labels="[
        'Never',
        'Rarely (A few times per year)',
        'Sometimes (Several times per month)',
        'Often (1-2 times per week)',
        'Mostly (3-4 times per week)',
        'Always (5 times or more per week)'
      ]"></radio-button-question>

    <p>To what extent is disturbed sleep a health problem to you?</p>
    <radio-button-question
      v-model="answers.ksq.q12"
      :labels="[
        'large problem',
        'rather large problem',
        'neither large nor small problem',
        'rather small problem',
        'very small problem'
      ]"></radio-button-question>


  </div>
</template>
<script>

import textboxQuestion from './form_parts/textbox-question.vue'
import textboxMultipart from './form_parts/textbox-multipart.vue'
import radioButtonQuestion from './form_parts/radio-button-question.vue'
import gridQuestion from './form_parts/grid-question.vue'
import langEntry from './form_parts/lang-entry.vue'

export default {
  name: 'about-you',
  components: {
    textboxMultipart,
    textboxQuestion,
    radioButtonQuestion,
    gridQuestion,
    langEntry
  },
  data: function() {
    return {
      answers: {
        ksq: {},
        other_langs: [{}]
      }
    }
  },
  methods: {
    updateFormErrors: function(namedErrors) {
      this.$emit('error-catch', namedErrors);
    },
    addLang: function() {
      this.answers.other_langs.push({})
    }
  },
  watch: {
    answers: {
      handler: function(val) {
        this.$emit('input', val);
      },
      deep: true
    }
  }
}
</script>
