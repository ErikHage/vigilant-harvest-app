<template>
  <v-card>
    <v-card-title>
      <h3>{{ stats.plantName }}</h3>
      <span class="subtitle">{{ stats.plantingId }}</span>
    </v-card-title>
    <v-card-text>
      <v-table>
        <tbody>
        <tr>
          <th>First Harvest</th>
          <td>{{ this.formatDate(stats.firstHarvest) }}</td>
        </tr>
        <tr>
          <th>Last Harvest</th>
          <td>{{ this.formatDate(stats.lastHarvest) }}</td>
        </tr>
        <tr>
          <th>Total Harvested</th>
          <td>{{ stats.totalQuantity }}</td>
        </tr>
        <tr>
          <th>Average Harvest per Day</th>
          <td>{{ stats.averageHarvestPerDay }}</td>
        </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: "StatsCard",

  props: {
    stats: {
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
