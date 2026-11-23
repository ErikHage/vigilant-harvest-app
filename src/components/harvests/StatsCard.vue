<template>
  <v-card>
    <v-card-title>
      <div v-if="group.plantingName" class="title-container">
        <h3 class="text-headline-small mb-2 font-weight-medium text-primary">{{ group.plantingName }}</h3>
        <div class="d-flex align-center mb-1">
          <v-icon size="small" class="me-2">mdi-sprout-outline</v-icon>
          <span class="text-body-large text-medium-emphasis">{{ group.plantName }}</span>
        </div>
        <div class="d-flex align-center" v-if="group.plotName">
          <v-icon size="small" class="me-2">mdi-vector-square</v-icon>
          <span class="text-title-small text-medium-emphasis">{{ group.plotName }}</span>
        </div>
      </div>
      <div v-else>
        <h3 class="text-headline-small font-weight-medium text-primary">{{ group.plantName }}</h3>
      </div>
    </v-card-title>
    <v-card-text>
      <v-table density="compact">
        <thead>
        <tr>
          <th></th>
          <th v-for="row in group.rows" :key="row.harvestTypeId">{{ row.harvestType }}</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <th>First Harvest</th>
          <td v-for="row in group.rows" :key="row.harvestTypeId">{{ formatDate(row.firstHarvest) }}</td>
        </tr>
        <tr>
          <th>Last Harvest</th>
          <td v-for="row in group.rows" :key="row.harvestTypeId">{{ formatDate(row.lastHarvest) }}</td>
        </tr>
        <tr>
          <th>Total Harvested</th>
          <td v-for="row in group.rows" :key="row.harvestTypeId">{{ formatQuantity(row.totalQuantity, row) }}</td>
        </tr>
        <tr>
          <th>Average Harvest per Day</th>
          <td v-for="row in group.rows" :key="row.harvestTypeId">
            {{ formatQuantity(toTenths(row.averageHarvestPerDay), row) }}
          </td>
        </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script>
import dayjs from 'dayjs';
import harvestUtils from "@/utils/harvest-utils";

// One planting's, or plant's, stats: a column for each harvest type, since
// totalQuantity and averageHarvestPerDay are per harvest type. The header
// names each column's type, unspecified included, though its quantities
// stay bare
export default {
  name: "StatsCard",

  props: {
    // the planting's, or plant's, names, and its stats rows, a row per
    // harvest type, in the order the columns go
    group: {
      type: Object,
      required: true,
    },
  },

  methods: {
    formatQuantity(quantity, row) {
      return harvestUtils.formatQuantity(quantity, row.harvestType);
    },

    // The service divides without rounding: 7 over 3 days is 2.3333333333333335
    toTenths(quantity) {
      return typeof quantity === 'number' ? Math.round(quantity * 10) / 10 : quantity;
    },

    formatDate(date) {
      return date ? dayjs(date).format('ddd MMM DD YYYY') : '---';
    }
  },
}
</script>
