<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <page-title title="Review Harvests"/>
        <v-spacer></v-spacer>
        <planting-year-select-card
            :available-years="availableYears"
            :on-select-year-change="onSelectYearChange"
            :on-select-year-clear="onSelectYearClear"
            :selected-year="plantingYear" />
        <v-spacer></v-spacer>
        <v-btn v-if="isPlantingYearSelected" class="mt-3" color="primary" @click="refreshData">Refresh</v-btn>
      </v-col>
      <v-col cols="12">
        <v-card v-if="isPlantingYearSelected">
          <v-card-text>
            <v-data-table
                :headers="headers"
                :items="hydratedHarvests"
                item-key="harvestId"
                class="elevation-1"
                density="compact"
            >
              <template #item.actions="{ item }">
<!--               TODO <v-icon small @click="openDialog(item)">mdi-pencil</v-icon>-->
                <!-- TODO add delete button, with confirm dialog. only admin can see/use it -->
              </template>
            </v-data-table>

          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { useCommonStore, useHarvestsStore, usePlantingsStore, usePlantsStore } from "@/store";
import PlantingYearSelectCard from "@/components/PlantingYearSelectCard.vue";
import PageTitle from "@/components/layout/PageTitle.vue";

export default {
  name: 'HarvestsPage',

  components: {
    PageTitle,
    PlantingYearSelectCard,
  },

  data: () => ({
    hydratedHarvests: [],
    headers: [
      { title: 'Plant', key: 'plantName' },
      { title: 'Quantity', key: 'quantity' },
      { title: 'Harvest Date', key: 'harvestDate' },
      { title: 'Actions', key: 'actions', sortable: false },
    ],
  }),

  computed: {
    ...mapState(useCommonStore, [
      'availableYears', 'plantingYear',
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

    isPlantingYearSelected() {
      return this.plantingYear != null;
    }
  },

  methods: {
    ...mapActions(useCommonStore, [
      'selectPlantingYear',
      'clearPlantingYear',
    ]),

    ...mapActions(usePlantsStore, [
      'fetchPlants',
    ]),

    ...mapActions(usePlantingsStore, [
      'fetchPlantingsByYear',
    ]),

    ...mapActions(useHarvestsStore, [
      'searchHarvests',
    ]),

    async onSelectYearChange(year) {
      this.selectPlantingYear(year);
      await this.refreshData();
    },

    async onSelectYearClear() {
      this.clearPlantingYear();
      await this.refreshData();
    },

    async loadHarvestsPage() {
      await this.searchHarvests(this.plantingYear);
      await this.fetchPlantingsByYear(this.plantingYear);

      this.hydratedHarvests = this.harvests.map(harvest => ({
        ...harvest,
        plantName: this.plantsById[this.plantingsById[harvest.plantingId].plantId].friendlyName,
      }));
    },

    async refreshData() {
      await this.loadHarvestsPage();
    },
  },

  async mounted() {
    await this.fetchPlants();
  }
}
</script>
<style scoped>

</style>