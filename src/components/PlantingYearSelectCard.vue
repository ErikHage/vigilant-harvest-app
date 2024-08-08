<template>
  <span
      v-if="selectedYear != null"
      class="heading">
    {{ selectedYear }}
    <v-btn
        color="red"
        variant="plain"
        @click="onSelectYearClear">
      <v-icon>mdi-close-circle</v-icon>
    </v-btn>
  </span>
  <v-select
      v-else
      :items="availableYears"
      :item-title="(year) => year"
      :item-value="(year) => year"
      label="Select Year"
      variant="solo"
      @update:model-value="onSelectYearChange"
  ></v-select>
</template>

<script>
export default {
  name: "PlantingYearSelectCard",

  props: [
      'availableYears',
      'onSelectYearChange',
      'onSelectYearClear',
      'selectedYear',
  ],
}
</script>

<style scoped>

</style>