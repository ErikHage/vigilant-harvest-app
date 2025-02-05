<template>
  <v-table>
    <tbody>
    <tr>
      <th class="details-header shrink-column">Family</th>
      <td>{{ plant.taxonomy.family }}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Genus</th>
      <td>{{ plant.taxonomy.genus }}</td>
    </tr>
    <tr>
      <th class="details-header shrink-column">Species</th>
      <td>{{ plant.taxonomy.species }}</td>
    </tr>
    </tbody>
  </v-table>
</template>

<script>
export default {
  name: "PlantTaxonomyTab",

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