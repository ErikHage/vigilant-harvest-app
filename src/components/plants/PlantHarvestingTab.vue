<template>
  <v-table>
    <tbody>
    <tr>
      <th class="details-header shrink-column">Fruit Size</th>
      <td>{{ plant.harvesting.fruitSize }}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Shelf Stability</th>
      <td>{{ plant.harvesting.shelfStability}}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Instructions</th>
      <td class="multiline-cell">{{ plant.harvesting.harvestInstructions }}</td>
    </tr>
    </tbody>
  </v-table>
</template>

<script>
export default {
  name: "PlantHarvestingTab",

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
  white-space: pre-wrap;
}
</style>