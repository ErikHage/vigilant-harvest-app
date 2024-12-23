<template>
  <v-container>

    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Stats"/>
        <v-spacer></v-spacer>
      </v-col>
      <v-col cols="2"></v-col>
      <v-col cols="8">

        <v-card>

          <v-card-text>

            <v-table>
              <tbody>
              <tr>
                <th>First Harvest</th>
                <td>{{ this.formatDate(this.stats.firstHarvestDate) }}</td>
              </tr>
              <tr>
                <th>Last Harvest</th>
                <td>{{ this.formatDate(this.stats.lastHarvestDate) }}</td>
              </tr>
              <tr>
                <th>Number of Days</th>
                <td>{{ stats.numberOfDays }}</td>
              </tr>
              <tr>
                <th>Number of Harvest Days</th>
                <td>{{ stats.numberOfHarvests }}</td>
              </tr>
              </tbody>
            </v-table>

          </v-card-text>

        </v-card>

      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

    <v-row>
      <v-col cols="2"></v-col>
      <v-col cols="8">

        <v-card v-for="plantingStatGroup in plantingStats">
          <v-card-title>
            <h3>{{ plantingStatGroup.plantName }}</h3>
            <span class="subtitle">{{ plantingStatGroup.plantingId }}</span>
          </v-card-title>
          <v-card-text>
            <v-table>
              <tbody>
              <tr>
                <th>First Harvest</th>
                <td>{{ this.formatDate(plantingStatGroup.firstHarvest) }}</td>
              </tr>
              <tr>
                <th>Last Harvest</th>
                <td>{{ this.formatDate(plantingStatGroup.lastHarvest) }}</td>
              </tr>
              <tr>
                <th>Total Harvested</th>
                <td>{{ plantingStatGroup.totalQuantity }}</td>
              </tr>
              <tr>
                <th>Average Harvest per Day</th>
                <td>{{ plantingStatGroup.averageHarvestPerDay }}</td>
              </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { useCommonStore, useHarvestsStore } from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";

export default {
  name: 'StatsPage',

  components: {
    PageTitle,
  },

  data: () => ({}),

  computed: {
    ...mapState(useCommonStore, [
      'plantingYear',
    ]),

    ...mapState(useHarvestsStore, [
      'harvestStats',
    ]),

    stats() {
      return {
        ...this.harvestStats,
      };
    },

    plantingStats() {
      if (this.harvestStats && this.harvestStats.plantingStats) {
        return Object.values(this.harvestStats.plantingStats);
      }
      return [];
    },
  },

  methods: {
    ...mapActions(useHarvestsStore, [
      'fetchHarvestStats',
    ]),

    async refreshData() {
      await this.fetchHarvestStats(this.plantingYear);
    },

    formatDate(date) {
      return date ? new Date(date).toDateString() : '---';
    }
  },

  mounted() {
    this.refreshData();
  }
}
</script>

<style scoped>
.subtitle {
  font-size: small;
  color: grey;
}
</style>