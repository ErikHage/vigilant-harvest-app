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
    /* scales with the window, but never too small to read on a phone or too big on a wide screen */
    font-size: clamp(1.25rem, 2vw, 2rem);
  }
</style>
