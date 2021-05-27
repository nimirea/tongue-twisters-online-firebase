<template>
  <div :class="['option-list', {'inline-option-list': inline === true}]">
    <radio-button v-for="(label, idx) in labels"
      v-bind:name="unique_name"
      v-bind:label="label"
      v-bind:value="value_list[idx]"
      v-bind:key="label"
      v-on:change="updateAppState(value_list[idx])"
      :parent-value = "selectedValue"
      :class="selectedValue === value_list[idx] ? 'selected-option' : ''"
    ></radio-button>
    <radio-button v-if="otherOption === true"
      v-bind:name="unique_name"
      v-bind:value="otherValSelected ? selectedValue : 'other'"
      v-bind:label="'Other (please note):'"
      v-bind:enter-text="true"
      :parent-value = "selectedValue"
      :class="otherValSelected === true ? 'selected-option' : ''"
      v-on:change="updateAppState"
    ></radio-button>
  </div>
</template>

<script>
import radioButton from './radio-button.vue';

export default {
  name: 'radio-button-question',
  components: {
    radioButton
  },
  props: {
    value: null,
    groupId: null,
    values: {
      type: Array,
      default: function() {
        return []
      }
    },
    labels: {
      type: Array,
      default: function () {
        return ['Yes', 'No']
      }
    },
    otherOption: {
      type: Boolean,
      default: function() {
        return false
      }
    },
    inline: {
      type: Boolean,
      default: function() {
        return false
      }
    }
  },
  data: function() {
    return {
      selectedValue: null
    };
  },
  filters: {
    regularize: function (value) {
      return this.regularize(value)
    }
  },
  methods: {
    updateAppState: function(newValue) {
      // console.log("changed value of radio button question to " + newValue)

      this.selectedValue = newValue;

      // get label of selected value
      let label_to_emit = this.labels[this.value_list.indexOf(newValue)];

      // change it back if we need to (when we provide values, we do want those values to be used, right?)
      if (this.values != []) {
        label_to_emit = newValue
      }

      this.$emit('input', label_to_emit);
      this.$emit('error-catch', {
        'element_name': this.groupId,
        'num_errors': this.selectedValue === null ? 1 : 0
      });
    },
    regularize: function (value) {
      value = value.replaceAll(" ", "-")
      value = value.replaceAll(".", "")
      value = value.replaceAll("/", "-")
      value = value.replaceAll(",", "")


      return (value)

    }
  },
  computed: {
    value_list: function() {
      if (this.values.length === 0) {
        let $regularize = this.regularize;

        return this.labels.map(function(item) {
          return $regularize(item)
        });
      } else {
        return this.values.map(function(item) {
          return String(item);
        });
      }
    },
    getVal: function() {
      return(this.value);
    },
    otherValSelected: function() {
      return (!(this.value_list.includes(this.selectedValue)) && this.selectedValue !== null)
    },
    unique_name: function() {
      if (this.groupId === null || this.groupId === undefined) {
        return String(this._uid)
      } else {
        return this.groupId;
      }
    }
  }
}
</script>
