<template>
  <v-dialog v-model="show" max-width="500px" persistent>
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn v-bind="activatorProps" class="mx-1" text="Start" color="green" @click="show = true"/>
    </template>

    <v-card>
      <v-card-title>
        <span class="headline">Start Planting</span>
      </v-card-title>
      <v-card-text>
        <v-text-field
            v-model.number="form.numberSown"
            type="number"
            label="Number Sown"
            variant="solo"
            density="compact"/>

        <div class="d-flex align-center">
          <date-picker-dialog-activator
              :on-submit="setDateValue"
              title="Override Sow Date"
              :date="form.sowDate"/>
          <h3 class="ml-2">{{ formattedSowDate }}</h3>
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

import plantingUtils from '../../utils/plantings';

import DatePickerDialogActivator from "@/components/utils/DatePickerDialogActivator.vue";

const { plantingActions } = plantingUtils;

export default {
  name: "StartPlantingActionDialog",

  components: {
    DatePickerDialogActivator
  },

  props: {
    planting: {
      type: Object,
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
        sowDate: new Date(),
        numberSown: 0,
      },
    };
  },

  computed: {
    formattedSowDate() {
      return this.form.sowDate.toDateString();
    },
  },

  methods: {
    getDataToSubmit() {
      return {
        sowDate: this.form.sowDate.toISOString(),
        numberSown: this.form.numberSown,
      };
    },

    handleSubmit() {
      this.onSubmit(plantingActions.start, this.getDataToSubmit());
      this.show = false;
    },

    handleCancel() {
      this.show = false;
    },

    setDateValue(newDateValue) {
      this.form.sowDate = newDateValue;
    },
  },
}
</script>

<style scoped>

</style>