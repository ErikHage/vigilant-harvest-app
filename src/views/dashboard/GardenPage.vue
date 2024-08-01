<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-card v-if="selectedYear == null">
          <v-card-title>
            <v-spacer></v-spacer>
            <v-select
                v-model="selectedYear"
                :items="availableYears"
                :item-title="(year) => year"
                :item-value="(year) => year"
                label="Select Year"
                variant="solo"
                @update:model-value="onSelectYearChange"
            ></v-select>
          </v-card-title>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card v-if="selectedYear != null">
          <v-card-title>
            <span class="headline">Garden</span>
          </v-card-title>
          <v-card-text>
            coming soon - a view of all your plots and plantings for a given year!
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script>

import { mapActions } from "pinia";
import { usePlantingsStore } from "@/store";

export default {
  name: 'GardenPage',

  components: {},

  data: () => ({
    availableYears: [2024, 2025], // TODO source from backend
    selectedYear: null,
  }),

  methods: {
    async onSelectYearChange(year) {

    },

    async refreshData() {
      if (this.selectedYear) {
        await this.fetchPlantingsByYear(this.selectedYear);
      }
    },
  },
}
</script>
