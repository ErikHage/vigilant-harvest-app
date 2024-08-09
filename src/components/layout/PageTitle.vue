<template>
  <span class="page-title">{{ title }}</span>
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
    font-size: 2.5vw;
  }
</style>