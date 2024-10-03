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
    currentPage: 1,
    pageSize: 25,
  }),

  computed: {
    ...mapState(useCommonStore, [
      'availableYears', 'plantingYear',
    ]),

    ...mapState(useHarvestsStore, [
      'harvestsPage',
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

    async loadHarvestsPage(page) {
      await this.searchHarvests(this.pageSize);
      this.currentPage = page;
    },

    async refreshData() {
      await this.loadHarvestsPage(this.currentPage);
    },
  },

  mounted() {
    this.refreshData();
  }
}
</script>
<style scoped>

</style>