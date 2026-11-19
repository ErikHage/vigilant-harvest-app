<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-2 mb-2">
      <v-select
          :model-value="year"
          @update:model-value="year => $emit('update:year', year)"
          :items="years"
          label="Planting Year"
          variant="solo"
          density="compact"
          hide-details
          class="year-select"
      />

      <v-card
          v-if="sortedHarvests.length > 0"
          variant="tonal"
          density="compact"
          class="ml-auto totals"
      >
        <v-card-text class="d-flex flex-wrap align-center ga-1 pa-2">
          <span class="mr-1 totals-label">Totals</span>
          <v-chip
              v-for="total in totalsByType"
              :key="total.harvestTypeId"
              size="small"
          >
            {{ formatQuantity(total.quantity, total.harvestType) }}
          </v-chip>
        </v-card-text>
      </v-card>
    </div>

    <v-table v-if="sortedHarvests.length > 0" density="compact">
      <thead>
        <tr>
          <th>Date</th>
          <th>Quantity</th>
        </tr>
      </thead>
      <tbody>
        <tr
            v-for="harvest in sortedHarvests"
            :key="harvest.harvestId"
        >
          <td>{{ harvest.harvestDate }}</td>
          <td>{{ formatQuantity(harvest.quantity, harvest.harvestType) }}</td>
        </tr>
      </tbody>
    </v-table>

    <div v-else-if="loaded" class="pa-4">No harvests in {{ year }}.</div>
  </div>
</template>

<script>
import harvestUtils from "@/utils/harvest-utils";

// A planting's harvests in one of its years, newest first, with a total for
// each harvest type: pounds can't be added to a count. The page owns the year
// and the search
export default {
  name: "PlantingHarvestsTab",

  props: {
    harvests: { type: Array, required: true },
    years: { type: Array, required: true },
    year: Number,
    // false while the year's harvests are on their way, so the empty message
    // doesn't flash first
    loaded: Boolean,
  },

  emits: ['update:year'],

  computed: {
    // YYYY-MM-DD dates sort as the days do
    sortedHarvests() {
      return [...this.harvests].sort((a, b) => b.harvestDate.localeCompare(a.harvestDate));
    },

    totalsByType() {
      const totals = {};
      for (const harvest of this.harvests) {
        const total = totals[harvest.harvestTypeId] ??= {
          harvestTypeId: harvest.harvestTypeId,
          harvestType: harvest.harvestType,
          quantity: 0,
        };
        total.quantity += harvest.quantity;
      }
      return Object.values(totals).sort(harvestUtils.sortByQuantityDescending);
    },
  },

  methods: {
    formatQuantity(quantity, harvestType) {
      return harvestUtils.formatQuantity(quantity, harvestType);
    },
  },
}
</script>

<style scoped>
.year-select {
  max-width: 200px;
}

.totals-label {
  font-weight: 500;
}
</style>
