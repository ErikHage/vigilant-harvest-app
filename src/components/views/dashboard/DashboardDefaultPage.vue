<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <span class="headline">Dashboard</span>
          </v-card-title>
          <v-card-text>
            You are logged in to the Vigilant Harvest Garden Tracker!
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <br/>

    <planting-year-select-card
        :available-years="availableYears"
        :on-select-year-change="onSelectYearChange"
        :on-select-year-clear="onSelectYearClear"
        :selected-year="plantingYear" />

  </v-container>
</template>

<script>

import PlantingYearSelectCard from "@/components/PlantingYearSelectCard.vue";
import { useCommonStore } from "@/store";
import { mapActions, mapState } from "pinia";

export default {
  name: 'DashboardDefaultPage',

  components: { PlantingYearSelectCard },

  data() {
    return {
      loading: false,
    };
  },

  computed: {
    ...mapState(useCommonStore, [
      'availableYears', 'plantingYear',
    ]),
  },

  methods: {
    ...mapActions(useCommonStore, [
      'selectPlantingYear',
      'clearPlantingYear',
    ]),

    async onSelectYearChange(year) {
      this.loading = true;
      this.selectPlantingYear(year);
      this.loading = false;
    },

    async onSelectYearClear() {
      this.clearPlantingYear();
    },
  },
}
</script>
