<template>
  <div class="checkboxes option-list">
    <span
      v-for="option in options"
      v-bind:key="option | regularize"
      :class = "displayedValues.includes(option)? 'selected-option' : '' "
    >
      <input type="checkbox"
        v-bind:value="option"
        v-bind:checked="displayedValues.includes(option)"
        v-bind:id="option | regularize"
        v-on:change="updateAppState"
        v-bind:disabled="unclickable === true"
      />&nbsp;
      <label
        v-bind:for="option | regularize"
        v-bind:key="option | regularize"
      >{{ option }}</label>
    </span>
  </div>
</template>

<script>

export default {
  name: 'checkbox-question',
  props: {
    groupId: null,
    atleastOne: {
      type: Boolean,
      default: false
    },
    options: {
      type: Array,
      default: function () {
        return ['wired',
                'wireless'
              ]
        }
      },
    alreadyChecked: { // which options are already checked?
      type: Array,
      default: function() {
        return []
      }
    },
    unclickable: {
      type: Boolean,
      default: false
    }
  },
  data: function() {
    return {
      selectedValues: []
    }
  },
  filters: {
    regularize: function (value) {
      value = value.replace(" ", "-")
      value = value.replace(".", "")

      return (value)

    }
  },
  methods: {
    updateAppState: function(newValue) {

      // add or remove value as needed
      if (newValue.target.checked === true) {
        this.selectedValues.push(newValue.target.value)
      } else {
        this.selectedValues = this.selectedValues.filter(item => item !== newValue.target.value)
      }

      this.$emit('input', this.selectedValues);

      if (this.atLeastOne === true) {
        this.$emit('error-catch', {
          'element_name': this.groupId,
          'num_errors': this.selectedValues === [] ? 1 : 0
        });
      }
    }
  },
  computed: {
    getVal: function() {
      return(this.value);
    },
    displayedValues: function() {
      if (this.alreadyChecked.length > 0 && this.selectedValues.length === 0) {
        return this.alreadyChecked
      } else {
        return this.selectedValues
      }
    }
  },
  created: function() {
  }
}
</script>
