<template>
  <!-- a page's actions sit to the right of its title, and wrap below it when there isn't room -->
  <div class="d-flex align-center flex-wrap ga-3">
    <span class="page-title">{{ title }}</span>
    <v-spacer/>
    <div v-if="$slots.actions" class="page-actions d-flex flex-wrap ga-3">
      <slot name="actions"/>
    </div>
  </div>
</template>

<script>
export default {
  name: "PageTitle",

  props: {
    title: {
      type: String,
      required: true,
    },
  },
}
</script>

<style scoped>
  .page-title {
    font-weight: bold;
    font-size: 2vw;
  }
</style>
