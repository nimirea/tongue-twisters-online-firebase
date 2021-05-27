<template>
  <span>
    <input type="radio"
      :value="enterText === true ? textbox_value : value"
      :name="name"
      v-model="radioButtonValue"
      :id="name + '-' + value | regularize"
      @change="updateView"
    >&nbsp;
    <label v-bind:for="name + '-' + value | regularize">
        {{label}}
        <textbox-question v-if="enterText === true"
          v-model="textbox_value"
          :question-text="''"
          :inline="true"
          @focus="selectOther"
          @input="updateView"
        ></textbox-question>
    </label><br/>
  </span>
</template>

<script>
import textboxQuestion from './textbox-question.vue';

export default {
  name: 'radio-button',
  props: {
    'name': String,
    'label': {
      type: String,
      default: "Other (please note):"
    },
    'value': {
      type: String,
      default: function () {
        return ""
      }
    },
    'enterText': {
      type: Boolean,
      default: function () {
        return false
      }
    },
    'parentValue': {
      type: String,
      default: function() {
        return ""
      }
    }
  },
  components:{
    textboxQuestion
  },
  filters: {
    regularize: function (value) {
      value = value.split(", ")

      return (value[0])

    }
  },
  data: function() {
    return {
      radioButtonValue: null,
      textbox_value: ""
    }
  },
  methods: {
    updateView: function() {
      if (this.textbox_value !== null) {
        this.radioButtonValue = this.textbox_value;
      }

      if (this.textbox_value === "" && this.enterText === false) {
        this.radioButtonValue = this.value
      }

      // console.log("emitting value: " + this.radioButtonValue);
      this.$emit("change", this.radioButtonValue)
    },
    selectOther: function() {
      // console.log("select other triggered")
      this.radioButtonValue = this.textbox_value;
      this.updateView();
    }
  },
  computed: {
    calculated_value: function() {
      if (this.enterText === true) {
        if (this.textbox_value === "") {
          return 'other'
        } else {
          return this.textbox_value
        }
      } else {
        return this.label
      }
    }
  }
}
</script>
