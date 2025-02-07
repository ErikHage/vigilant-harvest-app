<template>
  <v-card class="harvest-card" v-for="harvestDate in harvestDates" >

    <v-card-title>
      <v-row>

        <v-col class="text-left">
          <h3>{{ formatHarvestDate(harvestDate) }}</h3>
        </v-col>

        <v-col class="text-right">
          <v-btn
              size="small"
              color="default"
              @click="handleEditClicked(hydratedHarvestsByDate[harvestDate])">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </v-col>

      </v-row>
    </v-card-title>

    <v-card-text>
      <v-table class="no-lines" density="compact">
        <tbody>
        <tr v-for="harvest in hydratedHarvestsByDate[harvestDate]" :key="harvest.harvestId">
          <td class="quantity-column text-right">
            <v-chip :color="getQuantityColor(harvest.quantity)">{{ harvest.quantity }}</v-chip>
          </td>
          <td class="planting-column text-left">{{ harvest.plantName }}</td>
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
      onEdit: Function,
    },

    methods: {
      formatHarvestDate(dateTimeString) {
        const date = new Date(dateTimeString);
        const options = { month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
      },

      handleEditClicked(harvests) {
        this.onEdit(harvests);
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

  .quantity-column {
    width: 40%;
  }
  .planting-column {
    width: 60%;
  }
</style>