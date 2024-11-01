<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <page-title title="Review Harvests"/>
        <v-spacer></v-spacer>
        <v-btn class="mt-3" color="primary" @click="refreshData">Refresh</v-btn>
      </v-col>
      <v-col cols="12">
        <v-card>
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

    async onSelectYearChange(year) {
      this.selectPlantingYear(year);
      await this.refreshData();
    },

    async onSelectYearClear() {
      this.clearPlantingYear();
      await this.refreshData();
    },

    async refreshData() {
      await this.fetchPlants();
      await this.searchHarvests(this.plantingYear);
      await this.fetchPlantingsByYear(this.plantingYear);

      this.hydratedHarvests = this.harvests.map(harvest => ({
        ...harvest,
        plantName: this.plantsById[this.plantingsById[harvest.plantingId].plantId].friendlyName,
      }));
    },
  },

  async mounted() {
    await this.refreshData();
  }
}
</script>
<style scoped>

</style>