<template>
  <h1 v-if="pageView === true">Loading<br/>{{ '\xa0' + dots }}</h1>
  <p v-else>Loading{{ dots }}</p>
</template>
<script>
export default {
  name: 'loading-view',
  props: {
    pageView: {
      default: true,
      type: Boolean
    }
  },
  data: function() {
    return {
      character: ".",
      num_dots_display: 0,
      min_dots: 0,
      max_dots: Infinity,
      dots_per_second: 10,
      dots_per_line: 10
    }
  },
  mounted: function () {
    this.updateDots();
  },
  methods: {
    updateDots: function updateDateTime() {
      var self = this;
      self.num_dots_display = self.num_dots_display === self.max_dots ? self.min_dots : self.num_dots_display + 1;
      setTimeout(self.updateDots, 1000 / self.dots_per_second);
    }
  },
  computed: {
    dots: function() {

      if (this.num_dots_display <= this.dots_per_line) {
        return (this.character).repeat(this.num_dots_display);
      } else {
        let one_line = (this.character).repeat(this.dots_per_line);
        let num_full_lines = Math.floor(this.num_dots_display / this.dots_per_line);
        return (one_line + ' ').repeat(num_full_lines) + (this.character).repeat(this.num_dots_display % this.dots_per_line)
      }

    }
  }
}
</script>
