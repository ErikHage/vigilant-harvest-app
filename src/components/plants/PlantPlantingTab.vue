<template>
  <v-table>
    <tbody>
    <tr>
      <th class="details-header shrink-column">Planting Depth</th>
      <td>{{ plant.planting.depthInInches }}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Plant Spacing (in)</th>
      <td>{{ plant.planting.plantSpacingInches}}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Row Spacing (in)</th>
      <td>{{ plant.planting.rowSpacingInches }}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Instructions</th>
      <td class="multiline-cell">{{ plant.planting.instructions }}</td>
    </tr>
    </tbody>
  </v-table>
</template>

<script>
export default {
  name: "PlantPlantingTab",

  props: {
    plant: Object,
  },
}
</script>

<style scoped>
.details-header {
  font-weight: bold;
}
.shrink-column {
  white-space: nowrap;
  width: 1%;
}
.multiline-cell {
  white-space: pre;
}
</style>