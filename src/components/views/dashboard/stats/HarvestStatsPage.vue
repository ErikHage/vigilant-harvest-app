<template>
  <v-container>

    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Harvest Stats"/>
        <v-spacer></v-spacer>
        <fade-out-alert :is-visible="alert.isVisible" :alert-type="alert.type" :message="alert.message"/>
      </v-col>

      <v-col cols="2"></v-col>
      <v-col cols="8">

        <div v-if="totals">
          <harvest-stats-card :harvest-stats="totals"/>
        </div>

      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

    <v-row>
      <v-col cols="2"></v-col>
      <v-col cols="8">

        <v-card>
          <v-tabs
              v-model="tab"
              align-tabs="center"
              fixed-tabs
          >
            <v-tab v-for="kind in kinds" :key="kind.tab" :value="kind.tab">{{ kind.title }}</v-tab>
          </v-tabs>

          <v-card-text>
            <v-tabs-window v-model="tab">
              <v-tabs-window-item v-for="kind in kinds" :key="kind.tab" :value="kind.tab" eager>
                <harvest-stats-tab :harvest-stats="harvestStats[kind.statsType]" :label="kind.label"/>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card-text>
        </v-card>

      </v-col>
      <v-col cols="2"></v-col>
    </v-row>

  </v-container>
</template>

<script>

import {mapActions, mapState} from "pinia";
import {useCommonStore, useHarvestsStore} from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import HarvestStatsCard from "@/components/harvests/HarvestStatsCard.vue";
import HarvestStatsTab from "@/components/harvests/HarvestStatsTab.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";

// Each tab: the type of stats it shows, and its select's label
const kinds = [
  { tab: 'plants', title: 'Plants', statsType: 'Plant', label: 'Select Plant to View' },
  { tab: 'plantings', title: 'Plantings', statsType: 'Planting', label: 'Select Planting to View' },
];

// The year's harvest stats: its totals, then a tab for plants and one for
// plantings. It was two pages, one for each
export default {
  name: 'HarvestStatsPage',

  components: {
    FadeOutAlert,
    HarvestStatsCard,
    HarvestStatsTab,
    PageTitle,
  },

  data: () => ({
    kinds,
    tab: 'plants',
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

    // The year's totals, the same whichever type they came with: none
    // until one has loaded
    totals() {
      return this.harvestStats.Plant ?? this.harvestStats.Planting ?? null;
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
      await Promise.all(kinds.map(kind => this.fetchHarvestStats(this.plantingYear, kind.statsType)));
    },
  },

  mounted() {
    this.refreshData();
  }
}
</script>
