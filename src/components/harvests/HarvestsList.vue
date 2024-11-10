<template>
  <v-card class="harvest-card" v-for="harvestDate in harvestDates" >
    <v-card-title>
      {{ formatHarvestDate(harvestDate) }}
    </v-card-title>
    <v-card-text>
      <v-table class="no-lines" density="compact">
        <tbody>
        <tr v-for="harvest in hydratedHarvestsByDate[harvestDate]">
          <td class="equal-columns text-right">
            <v-chip :color="getQuantityColor(harvest.quantity)">{{ harvest.quantity }}</v-chip>
          </td>
          <td class="equal-columns text-left">{{ harvest.plantName }}</td>
        </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script>
  export default {
    name: 'HarvestsList',

    props: {
      harvestDates: Array,
      hydratedHarvestsByDate: Object,
    },

    methods: {
      formatHarvestDate(dateTimeString) {
        const date = new Date(dateTimeString);
        const options = { month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
      },

      getQuantityColor(quantity) {
        if (quantity <= 1) {
          return "#4575b4";
        } else if (quantity <= 5) {
          return "#91bfdb"
        } else if (quantity <= 10) {
          return "#ffffbf"
        } else if (quantity <= 20) {
          return "#fdae61"
        } else {
          return "#d73027";
        }
      }
    },
  }
</script>

<style scoped>
  .harvest-card {
    margin-bottom: 5px;
  }

  .no-lines {
    border: none;
    border-collapse: collapse;
  }

  .no-lines tr,
  .no-lines th,
  .no-lines td {
    border: none !important;
  }

  .equal-columns {
    width: 50%;
  }
</style>