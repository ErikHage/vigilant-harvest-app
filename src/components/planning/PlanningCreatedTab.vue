<template>
  {{ plantings }}
</template>

<script>
export default {
  name: "PlanningCreatedTab",

  props: {
    plantings: Array,
    plantsMap: Object,
  },
}
</script>

<style scoped>
.shrink-column {
  white-space: nowrap;
  width: 1%;
}
.multiline-cell {
  white-space: pre-wrap;
}
</style>