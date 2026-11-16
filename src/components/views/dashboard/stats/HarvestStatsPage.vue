<template>
  <v-container>

    <v-row>
      <v-col cols="12">
        <page-title title="Harvest Stats"/>
        <v-spacer></v-spacer>
        <fade-out-alert :is-visible="alert.isVisible" :alert-type="alert.type" :message="alert.message"/>
      </v-col>

      <v-col cols="3"></v-col>
      <v-col cols="6">
        <div v-if="totals">
          <harvest-stats-card :harvest-stats="totals"/>
        </div>
      </v-col>
      <v-col cols="3"></v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
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

const kinds = [
  { tab: 'plants', title: 'Plants', statsType: 'Plant', label: 'Select Plant to View' },
  { tab: 'plantings', title: 'Plantings', statsType: 'Planting', label: 'Select Planting to View' },
];

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
