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
                <td>{{ formattedStats.firstHarvestDate }}</td>
              </tr>
              <tr>
                <th>Last Harvest</th>
                <td>{{ formattedStats.lastHarvestDate }}</td>
              </tr>
              <tr>
                <th>Number of Days</th>
                <td>{{ formattedStats.numberOfDays }}</td>
              </tr>
              <tr>
                <th>Number of Harvest Days</th>
                <td>{{ formattedStats.numberOfHarvests }}</td>
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

    formattedStats() {
      return {
        ...this.harvestStats,
        firstHarvestDate: this.harvestStats.firstHarvestDate
            ? new Date(this.harvestStats.firstHarvestDate).toDateString()
            : '---',
        lastHarvestDate: this.harvestStats.lastHarvestDate
            ? new Date(this.harvestStats.lastHarvestDate).toDateString()
            : '---',
      };
    }
  },

  methods: {
    ...mapActions(useHarvestsStore, [
      'fetchHarvestStats',
    ]),

    async refreshData() {
      await this.fetchHarvestStats(this.plantingYear);
    },
  },

  mounted() {
    this.refreshData();
  }
}
</script>
