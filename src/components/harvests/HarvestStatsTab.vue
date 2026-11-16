<template>
  <div>
    <v-select
        :model-value="selectedGroupKey"
        :items="statGroups"
        :item-title="getDisplayTitle"
        item-value="key"
        :label="label"
        variant="solo"
        clearable
        @update:model-value="onSelectedStatChange"
    />

    <stats-card v-if="selectedGroup" class="stats-card" :group="selectedGroup"/>
    <div v-else class="d-flex justify-center">
      No stats selected.
    </div>
  </div>
</template>

<script>
import StatsCard from "@/components/harvests/StatsCard.vue";

// One type's stats, plant or planting, on its tab of the stats page: a
// select of each one with stats, and a card for the one chosen, with a
// column per harvest type. The choice is the tab's own, kept while the
// other tab is shown
export default {
  name: 'HarvestStatsTab',

  components: {
    StatsCard,
  },

  props: {
    // the service's response for this type, or null before it loads
    harvestStats: {
      type: Object,
      default: null,
    },
    label: {
      type: String,
      required: true,
    },
  },

  data: () => ({
    selectedGroupKey: null,
  }),

  computed: {
    // stats come back one row per planting (or plant) x harvest type, so rows are grouped
    // back together, and each type is a column of the one card, the largest total first
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
  },

  methods: {
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
}
</script>

<style scoped>
.stats-card {
  margin-bottom: 5px;
}
</style>
