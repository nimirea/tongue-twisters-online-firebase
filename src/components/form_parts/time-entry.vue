<template>
  <span>{{questionText}}
    <textbox-multipart
      v-model="time_string"
      :question-text="''"
      :units="['hours', 'minutes']"
      :text-types="['integer', 'integer']"
      :response-ranges="[[1, 12], [0, 59]]"
      :box-size="'s'"
      :inline="true"
      :delimiter="':'"
      :display-units="false"
      :data-type="'time'"
    ></textbox-multipart>
    <radio-button-question
      v-model="ampm"
      :labels="['am', 'pm']"
      :group-id="group_id_opts"
      :inline="true"
    >
    </radio-button-question>
  </span>
</template>

<script>

import textboxMultipart from './textbox-multipart.vue'
import radioButtonQuestion from './radio-button-question.vue'

export default {
  name: 'time-entry',
  components: {
    textboxMultipart,
    radioButtonQuestion
  },
  props: {
    questionText: String
  },
  data: function() {
    return {
      ampm: null,
      time_string: {
        'hours': 0,
        'minutes': 0
      }
    }
  },
  methods: {
    emissions: function() {
      let errors = this.get_errors();

      if (errors.length === 0) {

        // build returned value
        let returned_value = this.time_string['hours'] + ':'

        if (this.time_string['minutes'] === undefined || this.time_string['minutes'] === '') {
          returned_value += '00'
        } else {
          returned_value += this.time_string['minutes'] < 10 ? '0' : ''
          returned_value += this.time_string['minutes']
        }

        returned_value += ' ' + this.ampm

        // console.log(returned_value);
        this.$emit('input', returned_value);
      }

    },
    get_errors:  function() {
      let result = []

      // only return errors if this is filled out
      if (this.time_string['hours'] !== 0 && this.ampm === null) {
        result.push("please select AM or PM")
      }

      this.$emit('error-catch', {
        'element_name': this._uid,
        'num_errors': result.length,
        'error_text': result
      });

      return result;
    }
  },
  watch: {
    ampm(new_val, old_val) {
      if (new_val != old_val) {
        this.emissions();
      }
    },
    time_string(new_val, old_val) {
      if (new_val != old_val) {
        this.emissions();
      }
    }
  },
  computed: {
    group_id_opts: function() {
      return (this._uid + "ampm")
    }
  }
}
</script>
