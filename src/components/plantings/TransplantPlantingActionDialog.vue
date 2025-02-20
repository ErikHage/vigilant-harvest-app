<template>
  <v-dialog v-model="show" max-width="500px" persistent>
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn v-bind="activatorProps" text="Transplant" color="green" @click="show = true"/>
    </template>

    <v-card>
      <v-card-title>
        <span class="headline">Transplant Planting</span>
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

        <div class="d-flex">
          <date-picker-dialog-activator
              :on-submit="setDateValue"
              title="Override Transplanted Date"
              :date="form.transplantDate"/>
          <p>{{ formattedTransplantDate }}</p>
        </div>
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

import DatePickerDialogActivator from "@/components/utils/DatePickerDialogActivator.vue";

export default {
  name: "TransplantPlantingActionDialog",

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
      },
    };
  },

  computed: {
    formattedTransplantDate() {
      return this.form.transplantDate.toISOString().split('T')[0];
    },
  },

  methods: {
    getDataToSubmit() {
      return {
        ...this.planting,
        transplantDate: this.form.transplantDate.toISOString(),
        numberTransplanted: this.form.numberTransplanted,
        plotId: this.form.plotId,
        currentStatus: 'OUTDOOR SOWN',
      };
    },

    handleSubmit() {
      this.onSubmit(this.getDataToSubmit());
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

<style scoped>

</style>