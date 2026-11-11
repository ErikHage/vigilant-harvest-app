<template>
  <v-card>
    <v-card-title>
      <div v-if="stats.plantingName" class="title-container">
        <h3 class="text-h5 mb-2 font-weight-medium text-primary">{{ stats.plantingName }}</h3>
        <div class="d-flex align-center mb-1">
          <v-icon size="small" class="me-2">mdi-sprout-outline</v-icon>
          <span class="text-subtitle-1 text-medium-emphasis">{{ stats.plantName }}</span>
        </div>
        <div class="d-flex align-center" v-if="stats.plotName">
          <v-icon size="small" class="me-2">mdi-vector-square</v-icon>
          <span class="text-subtitle-2 text-medium-emphasis">{{ stats.plotName }}</span>
        </div>
        <div class="d-flex align-center" v-if="harvestTypeLabel">
          <v-icon size="small" class="me-2">mdi-basket-outline</v-icon>
          <span class="text-subtitle-2 text-medium-emphasis">{{ harvestTypeLabel }}</span>
        </div>
      </div>
      <div v-else>
        <h3 class="text-h5 font-weight-medium text-primary">{{ stats.plantName }}</h3>
        <div class="d-flex align-center" v-if="harvestTypeLabel">
          <v-icon size="small" class="me-2">mdi-basket-outline</v-icon>
          <span class="text-subtitle-2 text-medium-emphasis">{{ harvestTypeLabel }}</span>
        </div>
      </div>
    </v-card-title>
    <v-card-text>
      <v-table>
        <tbody>
        <tr>
          <th>First Harvest</th>
          <td>{{ this.formatDate(stats.firstHarvest) }}</td>
        </tr>
        <tr>
          <th>Last Harvest</th>
          <td>{{ this.formatDate(stats.lastHarvest) }}</td>
        </tr>
        <tr>
          <th>Total Harvested</th>
          <td>{{ formatQuantity(stats.totalQuantity) }}</td>
        </tr>
        <tr>
          <th>Average Harvest per Day</th>
          <td>{{ formatQuantity(stats.averageHarvestPerDay) }}</td>
        </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script>
import dayjs from 'dayjs';
import harvestUtils from "@/utils/harvest-utils";

export default {
  name: "StatsCard",

  props: {
    stats: {
      type: Object,
      required: true,
    },
  },

  computed: {
    // totalQuantity and averageHarvestPerDay are per harvest type, not per planting
    harvestTypeLabel() {
      return harvestUtils.harvestTypeLabel(this.stats.harvestType);
    },
  },

  methods: {
    formatQuantity(quantity) {
      return harvestUtils.formatQuantity(quantity, this.stats.harvestType);
    },

    formatDate(date) {
      return date ? dayjs(date).format('ddd MMM DD YYYY') : '---';
    }
  },
}
</script>

<style scoped>
.subtitle {
  font-size: small;
  color: grey;
}
</style>
