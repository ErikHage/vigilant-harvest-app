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
<!--            TODO add harvests [data?] table-->
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { useCommonStore, useHarvestsStore } from "@/store";
import PlantingYearSelectCard from "@/components/PlantingYearSelectCard.vue";
import PageTitle from "@/components/layout/PageTitle.vue";

export default {
  name: 'HarvestsPage',

  components: {
    PageTitle,
    PlantingYearSelectCard,
  },

  data: () => ({
    headers: [
      // { title: 'Id', key: 'harvestId' }, // don't need to show this on table
      { title: 'Planting Id', key: 'plantingId' }, // TODO expand this to planting name
      { title: 'Quantity', key: 'quantity' },
      { title: 'Harvest Date', key: 'harvestDate' },
      { title: 'Actions', key: 'actions', sortable: false },
    ],
  }),

  computed: {
    ...mapState(useCommonStore, [
      'availableYears', 'plantingYear',
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
    },

    async refreshData() {
      await this.loadHarvestsPage();
    },
  },

  mounted() {
    this.refreshData();
  }
}
</script>
<style scoped>

</style>