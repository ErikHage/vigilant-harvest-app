<template>
  <v-text-field v-model="planting.plantingId" label="Id" variant="solo" density="compact" disabled/>

  <div class="d-flex">
    <v-text-field v-model="createdAt" label="Created At" variant="solo" density="compact" disabled/>
    <v-text-field v-model="lastModifiedAt" label="Last Updated" variant="solo" density="compact" disabled/>
  </div>

  <div class="d-flex">
    <v-text-field v-model="planting.seedSource" label="source" variant="solo" density="compact" disabled/>
    <v-text-field v-model="planting.lotNumber" label="Lot#" variant="solo" density="compact" disabled/>
  </div>

  <div class="d-flex">
    <v-btn class="px-1 mt-2" color="black" size="small" @click="navigateToPlantDetails(planting.plantId)">
      <v-icon>mdi-sprout-outline</v-icon>
    </v-btn>
    <v-text-field v-model="plant.friendlyName" class="ml-1" label="Plant" variant="solo" density="compact" disabled/>
    <v-btn class="px-1 mt-2" color="black" size="small" @click="navigateToPlotDetails(planting.plotId)">
      <v-icon>mdi-vector-square</v-icon>
    </v-btn>
    <v-text-field v-model="plotName" class="ml-1" label="Plot" variant="solo" density="compact" disabled/>
  </div>

  <div class="d-flex">
    <v-text-field v-model="sowDate" label="Sow Date" variant="solo" density="compact" disabled/>
    <v-text-field v-model="leadTime" label="Transplant Lead Time" variant="solo" density="compact" disabled/>
  </div>

  <div class="d-flex">
    <v-text-field v-model="transplantDate" label="Transplant Date" variant="solo" density="compact" disabled/>
    <v-text-field v-model="numberOfPlants" label="Number of Plants" variant="solo" density="compact" disabled/>
  </div>
</template>

<script>
export default {
  name: "PlantingDetailsTab",

  props: {
    planting: Object,
    plant: Object,
    plot: Object,
  },

  computed: {
    createdAt() {
      return this.planting ? new Date(this.planting.dateCreated).toLocaleString() : '--';
    },

    lastModifiedAt() {
      return this.planting ? new Date(this.planting.dateModified).toLocaleString() : '--';
    },

    plotName() {
      return this.plot ? this.plot.friendlyName : '---';
    },

    sowDate() {
      return this.planting.sowDate
          ? this.planting.sowDate
          : '---';
    },

    transplantDate() {
      return this.planting.transplantDate
          ? this.planting.transplantDate
          : '---';
    },

    numberOfPlants() {
      return this.planting.numberTransplanted || this.planting.numberSown || '---';
    },

    leadTime() {
      return this.planting.leadTimeWeeks
          ? this.planting.leadTimeWeeks + ' weeks'
          : '---';
    },
  },

  methods: {
    navigateToPlotDetails(plotId) {
      console.log('plot clicked, do something in the future');
    },

    navigateToPlantDetails(plantId) {
      this.$router.push({
        name: 'PlantDetailsPage',
        params: {
          plantId,
        },
      });
    },
  },
}
</script>

<style scoped>
.multiline {
  white-space: pre-wrap;
}
</style>