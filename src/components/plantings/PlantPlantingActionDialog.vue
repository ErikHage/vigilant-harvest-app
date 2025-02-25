<template>
  <v-dialog v-model="show"  max-width="500px" persistent>
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn v-bind="activatorProps" class="mx-1" text="Plant" color="green" @click="show = true"/>
    </template>

    <v-card>
      <v-card-title>
        <span class="headline">Plant Planting</span>
      </v-card-title>
      <v-card-text>
        <v-select
            v-model="form.plotId"
            :items="plots"
            :item-title="(plot) => plot.friendlyName"
            :item-value="(plot) => plot.plotId"
            label="Select Plot"
            variant="solo"
            density="compact"
        ></v-select>

        <v-text-field
            v-model.number="form.numberTransplanted"
            type="number"
            label="Number Transplanted"
            variant="solo"
            density="compact"/>

        <p>Date planted</p>
        <div class="d-flex align-center">
          <date-picker-dialog-activator
              :on-submit="setDateValue"
              title="Override Transplanted Date"
              :date="form.transplantDate"/>
          <h3 class="ml-2">{{ formattedTransplantDate }}</h3>
        </div>

        <v-textarea
            v-model="form.comment"
            class="mt-4"
            label="Comment (optional)"
            rows="4"></v-textarea>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" @click="handleCancel">Cancel</v-btn>
        <v-btn color="primary" @click="handleSubmit">Confirm</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>

import plantingUtils from '../../utils/plantings';

import DatePickerDialogActivator from "@/components/utils/DatePickerDialogActivator.vue";

const { plantingActions } = plantingUtils;

export default {
  name: "PlantPlantingActionDialog",

  components: {
    DatePickerDialogActivator
  },

  props: {
    planting: {
      type: Object,
    },
    plots: {
      type: Array,
      required: true,
    },
    onSubmit: {
      type: Function,
      required: true,
    },
  },

  data() {
    return {
      show: false,
      form: {
        transplantDate: new Date(),
        numberTransplanted: 0,
        plotId: null,
        comment: null,
      },
    };
  },

  computed: {
    formattedTransplantDate() {
      return this.form.transplantDate.toDateString();
    },
  },

  methods: {
    getDataToSubmit() {
      return {
        transplantDate: this.form.transplantDate.toISOString(),
        numberTransplanted: this.form.numberTransplanted,
        plotId: this.form.plotId,
        comment: this.form.comment,
      };
    },

    handleSubmit() {
      this.onSubmit(plantingActions.plant, this.getDataToSubmit());
      this.show = false;
    },

    handleCancel() {
      this.show = false;
    },

    setDateValue(newDateValue) {
      this.form.transplantDate = newDateValue;
    },
  },
}
</script>