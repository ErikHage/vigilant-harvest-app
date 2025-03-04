<template>
  <div v-if="planting">
    <v-text-field
        v-model="planting.plantingId"
        label="Id"
        variant="solo"
        density="compact"
        disabled/>

    <div class="d-flex">
      <v-text-field
          v-model="createdAt"
          label="Created At"
          variant="solo"
          density="compact"
          disabled/>
      <v-text-field
          v-model="lastModifiedAt"
          label="Last Updated"
          variant="solo"
          density="compact"
          disabled/>
    </div>

    <div class="d-flex">
      <v-text-field
          v-model="planting.seedSource"
          label="source"
          variant="solo"
          density="compact"
          :disabled="isFieldEditDisabled()"/>
      <v-text-field
          v-model="planting.lotNumber"
          label="Lot#"
          variant="solo"
          density="compact"
          :disabled="isFieldEditDisabled()"/>
    </div>

    <div class="d-flex">
      <v-btn class="px-1 mt-2" color="black" size="small" @click="navigateToPlantDetails(planting.plantId)">
        <v-icon>mdi-sprout-outline</v-icon>
      </v-btn>
      <v-autocomplete
          v-model="planting.plantId"
          :items="sortedPlants"
          :item-title="(plant) => plant.friendlyName"
          :item-value="(plant) => plant.plantId"
          label="Select Plant"
          variant="solo"
          density="compact"
          :disabled="isFieldEditDisabled('CREATED')"
          clearable
      ></v-autocomplete>
    </div>

    <div class="d-flex">
      <v-text-field
          v-model="planting.leadTimeWeeks"
          label="Transplant Lead Time (weeks)"
          variant="solo"
          density="compact"
          :disabled="isFieldEditDisabled('CREATED')"/>
      <v-text-field
          v-model="planting.sowDate"
          label="Sow Date"
          variant="solo"
          density="compact"
          :disabled="isFieldEditDisabled('STARTED')"/>
      <v-text-field
          v-model="planting.numberSown"
          label="Number Sown"
          variant="solo"
          density="compact"
          :disabled="isFieldEditDisabled('STARTED')"/>
    </div>

    <div class="d-flex">
      <v-btn class="px-1 mt-2" color="black" size="small" @click="navigateToPlotDetails(planting.plotId)">
        <v-icon>mdi-vector-square</v-icon>
      </v-btn>
      <v-select
          v-model="planting.plotId"
          :items="sortedPlots"
          :item-title="(plot) => plot.friendlyName"
          :item-value="(plot) => plot.plotId"
          label="Plot"
          variant="solo"
          density="compact"
          :disabled="isFieldEditDisabled('PLANTED')"
          clearable
      ></v-select>
    </div>

    <div class="d-flex">
      <v-text-field
          v-model="planting.transplantDate"
          label="Planting Date"
          variant="solo"
          density="compact"
          :disabled="isFieldEditDisabled('PLANTED')"/>
      <v-text-field
          v-model="planting.numberTransplanted"
          label="Number Planted"
          variant="solo"
          density="compact"
          :disabled="isFieldEditDisabled('PLANTED')"/>
    </div>
  </div>
</template>

<script>
import plantingUtils from '@/utils/plantings';
import sorting from "@/utils/sorting";

const { plantingStatusesList } = plantingUtils;

export default {
  name: "PlantingDetailsTab",

  props: {
    planting: Object,
    plants: Array,
    plots: Array,
    enableEdit: Boolean,
  },

  data() {
    return {
      isEditEnabled: false,
    };
  },

  computed: {
    createdAt() {
      return this.planting ? new Date(this.planting.dateCreated).toLocaleString() : '--';
    },

    lastModifiedAt() {
      return this.planting ? new Date(this.planting.dateModified).toLocaleString() : '--';
    },

    sortedPlots() {
      return this.plots.sort(sorting.sortByPlotFriendlyName);
    },

    sortedPlants() {
      return this.plants.sort(sorting.sortByPlantFriendlyName);
    },
  },

  watch: {
    enableEdit: {
      immediate: true,
      handler(newValue) {
        console.log('enableEdit changed: ', newValue);
        this.isEditEnabled = newValue;
      },
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

    isFieldEditDisabled(allowedStatuses = [...plantingStatusesList]) {
      if (!this.isEditEnabled) {
        return true;
      }
      return !allowedStatuses.includes(this.planting.currentStatus);
    },
  },
}
</script>

<style scoped>
.multiline {
  white-space: pre-wrap;
}
</style>