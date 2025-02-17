<template>
  <v-card>
    <v-card-title class="text-center">
      <h3>{{ hydratedPlot.friendlyName }}</h3>
    </v-card-title>
    <v-card-text>
      <v-table density="compact">
        <tbody>
        <tr v-for="planting in hydratedPlot.plantings">
          <td>
            <v-chip class="ml-2 mr-2" color="green">
              {{ planting.numberTransplanted }}<v-icon>mdi-leaf</v-icon>
            </v-chip>
          </td>
          <td class="text-center">
            <span>{{ planting.plant.friendlyName }}</span>
          </td>
          <td class="text-right">
            <v-chip v-if="planting.harvestQuantity > 0" color="yellow">
              {{ planting.harvestQuantity }}<v-icon>mdi-basket-fill</v-icon>
            </v-chip>
            <v-chip v-else color="grey">
              <v-icon>mdi-basket</v-icon>
            </v-chip>
          </td>
        </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'HarvestSummary',

  props: {
    hydratedPlot: Object,
  },
}
</script>

<style scoped>

</style>