<template>
  <v-container>

    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Stats"/>
        <v-spacer></v-spacer>
        <fade-out-alert :is-visible="alert.isVisible" :alert-type="alert.type" :message="alert.message" />
      </v-col>

      <v-col cols="2"></v-col>
      <v-col cols="8">

        <harvest-stats-card
            :harvest-stats="stats"/>

      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

    <v-row>
      <v-col cols="2"></v-col>
      <v-col cols="8">

        <v-select
            :items="plantingStats"
            :item-title="(plantingStats) => plantingStats.plantName"
            label="Select Planting To View Stats"
            variant="solo"
            clearable
            return-object
            @update:model-value="onSelectPlantingStatChange"
        />

        <div v-if="selectedPlantingStat !== null">
          <planting-stats-card
              class="planting-stats-card"
              :planting-stats="selectedPlantingStat"
          />
        </div>

      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

  </v-container>
</template>

<script>

import { mapActions, mapState } from "pinia";
import { useCommonStore, useHarvestsStore } from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import PlantingStatsCard from "@/components/plantings/PlantingStatsCard.vue";
import HarvestStatsCard from "@/components/harvests/HarvestStatsCard.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";

export default {
  name: 'StatsPage',

  components: {
    FadeOutAlert,
    HarvestStatsCard,
    PlantingStatsCard,
    PageTitle,
  },

  data: () => ({
    selectedPlantingStat: null,
  }),

  computed: {
    ...mapState(useCommonStore, {
      plantingYear: 'plantingYear',
    }),

    ...mapState(useHarvestsStore, {
      harvestStats: 'harvestStats',
      alertType: 'alertType',
      alertMessage: 'alertMessage',
      alertVisible: 'alertVisible',
    }),

    stats() {
      return {
        ...this.harvestStats,
      };
    },

    plantingStats() {
      if (this.harvestStats && this.harvestStats.stats) {
        return this.harvestStats.stats
            .sort((a, b) => {
              const nameA = a.plantingName || a.plantName || '';
              const nameB = b.plantingName || b.plantName || '';
              return nameA.localeCompare(nameB);
            });
      }
      return [];
    },


    alert() {
      return {
        isVisible: this.alertVisible,
        type: this.alertType,
        message: this.alertMessage,
      };
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
    },

    onSelectPlantingStatChange(plantingStat) {
      this.selectedPlantingStat = plantingStat;
    },
  },

  mounted() {
    this.refreshData();
  }
}
</script>

<style scoped>
.planting-stats-card {
  margin-bottom: 5px;
}
</style>
