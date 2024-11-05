<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <page-title title="Review Harvests"/>
        <v-spacer></v-spacer>
        <v-btn class="mt-3" color="primary" @click="refreshData">Refresh</v-btn>
      </v-col>
      <v-col cols="3"></v-col>
      <v-col cols="6">
        <!-- TODO make a custom component with better style -->
        <v-card class="harvest-card" v-for="harvestDate in harvestDates" >
          <v-card-title class="">
            {{ formatHarvestDate(harvestDate) }}
          </v-card-title>
          <v-card-text>
            <div v-for="harvest in hydratedHarvestsByDate[harvestDate]">
              {{ harvest.quantity }} - {{ harvest.plantName }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="3"></v-col>
    </v-row>
  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { useCommonStore, useHarvestsStore, usePlantingsStore, usePlantsStore } from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";

export default {
  name: 'HarvestsPage',

  components: {
    PageTitle,
  },

  data: () => ({
    harvestDates: [],
    hydratedHarvestsByDate: {},
    headers: [
      { title: 'Plant', key: 'plantName' },
      { title: 'Quantity', key: 'quantity' },
      { title: 'Harvest Date', key: 'harvestDate' },
      { title: 'Actions', key: 'actions', sortable: false },
    ],
  }),

  computed: {
    ...mapState(useCommonStore, [
      'plantingYear',
    ]),

    ...mapState(usePlantsStore, [
      'plantsById',
    ]),

    ...mapState(usePlantingsStore, [
      'plantingsById',
    ]),

    ...mapState(useHarvestsStore, [
      'harvests'
    ]),
  },

  methods: {
    ...mapActions(usePlantsStore, [
      'fetchPlants',
    ]),

    ...mapActions(usePlantingsStore, [
      'fetchPlantingsByYear',
    ]),

    ...mapActions(useHarvestsStore, [
      'searchHarvests',
    ]),

    async refreshData() {
      await this.fetchPlants();
      await this.searchHarvests(this.plantingYear);
      await this.fetchPlantingsByYear(this.plantingYear);

      this.hydratedHarvestsByDate = this.harvests
          .map(harvest => {
            console.log('mapping', harvest);
            return {
              ...harvest,
              plantName: this.plantsById[this.plantingsById[harvest.plantingId].plantId].friendlyName,
            };
          })
          .reduce((acc, hydratedHarvest) => {
            console.log('reducing', hydratedHarvest)
            if (!acc[hydratedHarvest.harvestDate]) {
              acc[hydratedHarvest.harvestDate] = [];
            }
            acc[hydratedHarvest.harvestDate].push(hydratedHarvest);
            return acc;
          }, {});

      this.harvestDates = Object.keys(this.hydratedHarvestsByDate).sort();
    },

    formatHarvestDate(dateTimeString) {
      const date = new Date(dateTimeString);
      const options = { month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    },
  },

  async mounted() {
    await this.refreshData();
  }
}
</script>
<style scoped>
  .harvest-card {
    margin-bottom: 5px;
  }
</style>