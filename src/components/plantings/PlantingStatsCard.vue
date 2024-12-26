<template>
  <v-card>
    <v-card-title>
      <h3>{{ plantingStats.plantName }}</h3>
      <span class="subtitle">{{ plantingStats.plantingId }}</span>
    </v-card-title>
    <v-card-text>
      <v-table>
        <tbody>
        <tr>
          <th>First Harvest</th>
          <td>{{ this.formatDate(plantingStats.firstHarvest) }}</td>
        </tr>
        <tr>
          <th>Last Harvest</th>
          <td>{{ this.formatDate(plantingStats.lastHarvest) }}</td>
        </tr>
        <tr>
          <th>Total Harvested</th>
          <td>{{ plantingStats.totalQuantity }}</td>
        </tr>
        <tr>
          <th>Average Harvest per Day</th>
          <td>{{ plantingStats.averageHarvestPerDay }}</td>
        </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: "PlantingStatsCard",

  props: {
    plantingStats: {
      type: Object,
      required: true,
    },
  },

  methods: {
    formatDate(date) {
      return date ? new Date(date).toDateString() : '---';
    }
  },
}
</script>

<style scoped>
.subtitle {
  font-size: small;
  color: grey;
}
</style>