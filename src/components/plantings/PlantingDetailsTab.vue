<template>
  <div v-if="planting">
    <div class="d-flex">
      <v-text-field
          v-model="planting.plantingId"
          label="Id"
          variant="solo"
          density="compact"
          disabled/>
      <v-text-field
          v-model="planting.name"
          label="Name"
          variant="solo"
          density="compact"
          :disabled="isFieldEditDisabled()"/>
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
      <v-text-field
          v-model="plantingYearsDisplay"
          label="Planting Years"
          variant="solo"
          density="compact"
          :disabled="true"/>
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
      <v-text-field
          v-model.number="planting.leadTimeWeeks"
          label="Transplant Lead Time (weeks)"
          variant="solo"
          type="number"
          density="compact"
          :disabled="isFieldEditDisabled('CREATED')"/>
    </div>

    <div class="d-flex align-center my-2">
      <v-divider class="flex-grow-1"></v-divider>
      <span class="mx-2 text-caption">Sowing</span>
      <v-divider class="flex-grow-1"></v-divider>
    </div>

    <div class="d-flex">
      <v-text-field
          v-model.number="planting.numberSown"
          label="Number Sown"
          variant="solo"
          type="number"
          density="compact"
          :disabled="isFieldEditDisabled('STARTED')"/>
      <div :class="getDateFieldClasses('STARTED')">
        <p class="mr-2">Date sown</p>
        <date-picker-dialog-activator
            :on-submit="setSowDateValue"
            title="Set Sow Date"
            :date="planting.sowDate"
            :disabled="isFieldEditDisabled('STARTED')"
        />
        <h3 class="ml-2">{{ formattedSowDate }}</h3>
      </div>
    </div>

    <div class="d-flex align-center my-2">
      <v-divider class="flex-grow-1"></v-divider>
      <span class="mx-2 text-caption">Planting</span>
      <v-divider class="flex-grow-1"></v-divider>
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
      <v-text-field
          v-model.number="planting.numberTransplanted"
          label="Number Planted"
          variant="solo"
          type="number"
          density="compact"
          :disabled="isFieldEditDisabled('PLANTED')"/>
      <div :class="getDateFieldClasses('PLANTED')">
        <p class="mr-2">Date planted</p>
        <date-picker-dialog-activator
            :on-submit="setPlantingDateValue"
            title="Set Planting Date"
            :date="planting.transplantDate"
            :disabled="isFieldEditDisabled('PLANTED')"
        />
        <h3 class="ml-2">{{ formattedPlantingDate }}</h3>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import plantingUtils from '@/utils/plantings';
import sorting from "@/utils/sorting";
import DatePickerDialogActivator from "@/components/utils/DatePickerDialogActivator.vue";

const {plantingStatusesList} = plantingUtils;

export default {
  name: "PlantingDetailsTab",
  components: {DatePickerDialogActivator},

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

    formattedPlantingDate() {
      return this.planting.transplantDate ?
          dayjs(this.planting.transplantDate).format('YYYY-MM-DD') :
          '--';
    },

    formattedSowDate() {
      return this.planting.sowDate ?
          dayjs(this.planting.sowDate).format('YYYY-MM-DD') :
          '--';
    },

    sortedPlots() {
      return this.plots.sort(sorting.sortByPlotFriendlyName);
    },

    sortedPlants() {
      return this.plants.sort(sorting.sortByPlantFriendlyName);
    },

    plantingYearsDisplay() {
      if (this.planting?.plantingYears) {
        let pys = this.planting?.plantingYears;
        if (pys.length > 1) {
          return pys[0] + ' - ' + pys[pys.length - 1];
        }
        if (pys.length === 1) {
          return pys[0];
        }
      }
      return '';
    },
  },

  watch: {
    enableEdit: {
      immediate: true,
      handler(newValue) {
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

    setSowDateValue(newDateValue) {
      this.planting.sowDate = newDateValue;
    },

    setPlantingDateValue(newDateValue) {
      this.planting.transplantDate = newDateValue;
    },

    getDateFieldClasses(allowedStatuses) {
      const isFieldEditDisabled = this.isFieldEditDisabled(allowedStatuses);

      let classes = 'd-flex align-center mx-2';
      if (isFieldEditDisabled) {
        classes += ' disabled-text';
      }
      return classes;
    }
  },
}
</script>

<style scoped>
.multiline {
  white-space: pre-wrap;
}

.disabled-text {
  color: gray;
}
</style>
