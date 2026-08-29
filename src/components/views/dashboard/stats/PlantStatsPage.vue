<template>
  <v-container>

    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Plant Stats"/>
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
            :items="statGroups"
            :item-title="getDisplayTitle"
            item-value="key"
            label="Select Plant to View"
            variant="solo"
            clearable
            @update:model-value="onSelectedStatChange"
        />

        <div v-if="selectedGroup">
          <stats-card
              v-for="row in selectedGroup.rows"
              :key="row.harvestTypeId"
              class="stats-card"
              :stats="row"
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
  name: 'PlantingStatsPage',

  components: {
    FadeOutAlert,
    HarvestStatsCard,
    StatsCard,
    PageTitle,
  },

  data: () => ({
    selectedGroupKey: null,
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

    // stats come back one row per planting (or plant) x harvest type, so rows are grouped
    // back together and each type is rendered as its own card
    statGroups() {
      const rows = this.harvestStats?.stats ?? [];

      const grouped = rows.reduce((acc, row) => {
        const key = row.plantingId ?? row.plantId;

        if (!acc[key]) {
          acc[key] = {
            key,
            plantingName: row.plantingName,
            plantName: row.plantName,
            plotName: row.plotName,
            rows: [],
          };
        }

        acc[key].rows.push(row);
        return acc;
      }, {});

      return Object.values(grouped)
          .map(group => ({
            ...group,
            rows: [...group.rows].sort((a, b) => b.totalQuantity - a.totalQuantity),
          }))
          .sort((a, b) => {
            const nameA = a.plantingName || a.plantName || '';
            const nameB = b.plantingName || b.plantName || '';
            return nameA.localeCompare(nameB);
          });
    },

    selectedGroup() {
      return this.statGroups.find(group => group.key === this.selectedGroupKey) ?? null;
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
      await this.fetchHarvestStats(this.plantingYear, "Plant");
    },

    onSelectedStatChange(key) {
      this.selectedGroupKey = key;
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
