<template>
  <v-card class="harvest-card" v-for="harvestDate in harvestDates" >
    <v-card-title class="">
      {{ formatHarvestDate(harvestDate) }}
    </v-card-title>
    <v-card-text>
      <div v-for="harvest in hydratedHarvestsByDate[harvestDate]">
        {{ harvest.quantity }} - {{ harvest.plantName }}
      </div>
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
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
      },
    },
  }
</script>

<style scoped>
  .harvest-card {
    margin-bottom: 5px;
  }
</style>