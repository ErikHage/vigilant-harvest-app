<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <page-title title="Review Harvests"/>
        <v-spacer></v-spacer>
        <v-btn class="mt-3" color="primary" @click="refreshData">Refresh</v-btn>
      </v-col>
      <v-col cols="4"></v-col>
      <v-col cols="4">
        <harvests-list
            :harvest-dates="harvestDates"
            :hydrated-harvests-by-date="hydratedHarvestsByDate"
            :on-edit="showEditHarvestsDialog"
        />
      </v-col>
      <v-col cols="4"></v-col>
    </v-row>
  </v-container>

  <edit-harvests-dialog
      :show="editHarvestsDialog"
      :harvests="selectedHarvests"
      :on-submit="updateHarvests"
      :on-cancel="onCloseEditHarvestsDialog"
  />

</template>

<script>

import { mapActions, mapState } from "pinia";
import { useCommonStore, useHarvestsStore, usePlantingsStore, usePlantsStore } from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import HarvestsList from "@/components/harvests/HarvestsList.vue";
import EditHarvestsDialog from "@/components/harvests/EditHarvestsDialog.vue";

export default {
  name: 'HarvestsPage',

  components: {
    PageTitle,
    HarvestsList,
    EditHarvestsDialog,
  },

  data: () => ({
    editHarvestsDialog: false,
    harvestDates: [],
    hydratedHarvestsByDate: {},
    selectedHarvests: [],
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
      'upsertHarvests',
    ]),

    async refreshData() {
      await this.fetchPlants();
      await this.searchHarvests(this.plantingYear);
      await this.fetchPlantingsByYear(this.plantingYear);

      this.hydratedHarvestsByDate = this.harvests
          .map(harvest => {
            return {
              ...harvest,
              plantName: this.plantsById[this.plantingsById[harvest.plantingId].plantId].friendlyName,
            };
          })
          .reduce((acc, hydratedHarvest) => {
            let harvestDate = hydratedHarvest.harvestDate;

            if (!acc[harvestDate]) {
              acc[harvestDate] = [];
            }

            acc[harvestDate].push(hydratedHarvest);
            return acc;
          }, {});

      this.harvestDates = Object.keys(this.hydratedHarvestsByDate).sort().reverse();
    },

    showEditHarvestsDialog(harvests) {
      this.selectedHarvests = harvests;
      this.editHarvestsDialog = true;
    },

    async updateHarvests(harvests) {
      this.onCloseEditHarvestsDialog();
    },

    onCloseEditHarvestsDialog() {
      this.selectedHarvests = [];
      this.editHarvestsDialog = false;
    },
  },

  async mounted() {
    await this.refreshData();
  }
}
</script>
<style scoped>

</style>