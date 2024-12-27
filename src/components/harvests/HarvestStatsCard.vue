<template>
  <v-card>
    <v-card-text>
      <v-table>
        <tbody>
        <tr>
          <th>First Harvest</th>
          <td>{{ this.formatDate(this.harvestStats.firstHarvestDate) }}</td>
        </tr>
        <tr>
          <th>Last Harvest</th>
          <td>{{ this.formatDate(this.harvestStats.lastHarvestDate) }}</td>
        </tr>
        <tr>
          <th>Number of Days</th>
          <td>{{ harvestStats.numberOfDays }}</td>
        </tr>
        <tr>
          <th>Number of Harvest Days</th>
          <td>{{ harvestStats.numberOfHarvests }}</td>
        </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: "HarvestStatsCard",

  props: {
    harvestStats: {
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