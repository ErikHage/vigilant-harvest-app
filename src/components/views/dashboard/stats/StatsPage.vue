<template>
  <v-container>

    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Stats"/>
        <v-spacer></v-spacer>
        <fade-out-alert :is-visible="alert.isVisible" :alert-type="alert.type" :message="alert.message"/>
      </v-col>

      <v-col cols="2"></v-col>
      <v-col cols="8">

        <div v-if="harvestStatsData">
          <harvest-stats-card :harvest-stats="harvestStatsData"/>
        </div>

      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

    <v-row>
      <v-col cols="2"></v-col>
      <v-col cols="8">

        <v-select
            :items="stats"
            :item-title="getDisplayTitle"
            item-value="index"
            label="Select Stats to View"
            variant="solo"
            clearable
            @update:model-value="onSelectedStatChange"
        />

        <div v-if="selectedStat">
          <stats-card
              class="stats-card"
              :stats="selectedStat"
          />
        </div>
        <div v-else class="d-flex justify-center">
          No stats selected.
        </div>

      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

  </v-container>
</template>

<script>

import {mapActions, mapState} from "pinia";
import {useCommonStore, useHarvestsStore} from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import StatsCard from "@/components/harvests/StatsCard.vue";
import HarvestStatsCard from "@/components/harvests/HarvestStatsCard.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";

export default {
  name: 'StatsPage',

  components: {
    FadeOutAlert,
    HarvestStatsCard,
    StatsCard,
    PageTitle,
  },

  data: () => ({
    selectedStatIndex: null,
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

    harvestStatsData() {
      return {
        ...this.harvestStats,
      };
    },

    stats() {
      if (this.harvestStats && this.harvestStats.stats) {
        return this.harvestStats.stats
            .sort((a, b) => {
              const nameA = a.plantingName || a.plantName || '';
              const nameB = b.plantingName || b.plantName || '';
              return nameA.localeCompare(nameB);
            })
            .map((item, index) => ({ ...item, index }));
      }
      return [];
    },

    selectedStat() {
      return this.selectedStatIndex !== null ? this.stats[this.selectedStatIndex] : null;
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

    onSelectedStatChange(index) {
      this.selectedStatIndex = index;
    },

    getDisplayTitle(item) {
      if (item.plantingName) {
        return `${item.plantingName} | ${item.plotName} | ${item.plantName}`;
      }
      return item.plantName;
    },
  },

  mounted() {
    this.refreshData();
  }
}
</script>

<style scoped>
.stats-card {
  margin-bottom: 5px;
}
</style>
