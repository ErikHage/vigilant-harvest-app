<template>
  <div class="d-flex justify-space-between">
    <v-text-field
        v-model="plantingCopy.plantingId"
        label="Id"
        variant="solo"
        density="compact"
        disabled/>

    <v-switch
        v-model="enableEdit"
        color="#00C000"
        base-color="#C00000">
      <template v-slot:label>
        <v-icon>{{ enableEdit ? 'mdi-lock-open' : 'mdi-lock' }}</v-icon>
      </template>
    </v-switch>
  </div>

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
        v-model="plantingCopy.seedSource"
        label="source"
        variant="solo"
        density="compact"
        :disabled="isFieldEditDisabled()"/>
    <v-text-field
        v-model="plantingCopy.lotNumber"
        label="Lot#"
        variant="solo"
        density="compact"
        :disabled="isFieldEditDisabled()"/>
  </div>

  <div class="d-flex">
    <v-btn class="px-1 mt-2" color="black" size="small" @click="navigateToPlantDetails(plantingCopy.plantId)">
      <v-icon>mdi-sprout-outline</v-icon>
    </v-btn>
    <v-text-field
        v-model="plant.friendlyName"
        class="ml-1"
        label="Plant"
        variant="solo"
        density="compact"
        :disabled="isFieldEditDisabled()"/>
  </div>

  <div class="d-flex">
    <v-text-field
        v-model="plantingCopy.leadTimeWeeks"
        label="Transplant Lead Time (weeks)"
        variant="solo"
        density="compact"
        :disabled="isFieldEditDisabled('CREATED')"/>
    <v-text-field
        v-model="plantingCopy.sowDate"
        label="Sow Date"
        variant="solo"
        density="compact"
        :disabled="isFieldEditDisabled('STARTED')"/>
    <v-text-field
        v-model="plantingCopy.numberSown"
        label="Number Sown"
        variant="solo"
        density="compact"
        :disabled="isFieldEditDisabled('STARTED')"/>
  </div>

  <div class="d-flex">
    <v-btn class="px-1 mt-2" color="black" size="small" @click="navigateToPlotDetails(plantingCopy.plotId)">
      <v-icon>mdi-vector-square</v-icon>
    </v-btn>
    <v-text-field
        v-model="plotName"
        class="ml-1"
        label="Plot"
        variant="solo"
        density="compact"
        :disabled="isFieldEditDisabled('PLANTED')"/>
  </div>

  <div class="d-flex">
    <v-text-field
        v-model="plantingCopy.transplantDate"
        label="Planting Date"
        variant="solo"
        density="compact"
        :disabled="isFieldEditDisabled('PLANTED')"/>
    <v-text-field
        v-model="plantingCopy.numberTransplanted"
        label="Number Planted"
        variant="solo"
        density="compact"
        :disabled="isFieldEditDisabled('PLANTED')"/>
  </div>
</template>

<script>
import plantingUtils from '@/utils/plantings';

const { plantingStatusesList } = plantingUtils;

export default {
  name: "PlantingDetailsTab",

  props: {
    planting: Object,
    plant: Object,
    plot: Object,
  },

  data() {
    return {
      enableEdit: false,
      plantingCopy: {
        plantingId: this.planting.plantingId,
        plotId: this.planting.plotId,
        plantId: this.planting.plantId,
        plantingYear: this.planting.plantingYear,
        name: this.planting.name,
        seedSource: this.planting.seedSource,
        lotNumber: this.planting.lotNumber,
        leadTimeWeeks: this.planting.leadTimeWeeks,
        sowDate: this.planting.sowDate,
        sowType: this.planting.sowType,
        numberSown: this.planting.numberSown,
        transplantDate: this.planting.transplantDate,
        numberTransplanted: this.planting.numberTransplanted,
      },
    };
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
  },

  methods: {
    isFieldEditDisabled(allowedStatuses = [...plantingStatusesList]) {
      if (!this.enableEdit) {
        return true;
      }
      return !allowedStatuses.includes(this.planting.currentStatus);
    },

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