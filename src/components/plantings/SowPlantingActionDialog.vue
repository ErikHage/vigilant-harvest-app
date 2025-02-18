<template>
  <v-dialog v-model="show" max-width="500px" persistent>
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn v-bind="activatorProps" text="Sow" color="green" @click="show = true"/>
    </template>

    <v-card>
      <v-card-title>
        <span class="headline">Sow Planting</span>
      </v-card-title>
      <v-card-text>
        <v-select
            v-model="form.sowType"
            label="Sow Location"
            variant="solo"
            density="compact"
            :items="sowTypesList"/>

        <v-select
            v-if="form.sowType === 'Outdoor'"
            v-model="form.plotId"
            :items="plots"
            :item-title="(plot) => plot.friendlyName"
            :item-value="(plot) => plot.plotId"
            label="Select Plot"
            variant="solo"
            density="compact"
        ></v-select>

        <v-text-field
            v-model.number="form.numberSown"
            type="number"
            label="Number Sown"
            variant="solo"
            density="compact"/>

        <div class="d-flex">
          <date-picker-dialog-activator
              :on-submit="setDateValue"
              title="Override Sow Date"
              :date="form.sowDate"/>
          <p>{{ formattedSowDate }}</p>
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
  name: "SowPlantingActionDialog",

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
      sowTypesList: ['Indoor', 'Outdoor'],
      form: {
        sowType: 'Indoor',
        sowDate: new Date(),
        numberSown: 0,
        plotId: null,
      },
    };
  },

  computed: {
    formattedSowDate() {
      return this.form.sowDate.toISOString().split('T')[0];
    },
  },

  methods: {
    getDataToSubmit() {
      return {
        ...this.planting,
        sowType: this.form.sowType,
        sowDate: this.form.sowDate.toISOString(),
        numberSown: this.form.numberSown,
        currentStatus: this.form.sowType === 'Indoor' ? 'INDOOR SOWN' : 'OUTDOOR SOWN',
        plotId: this.form.sowType === 'Outdoor' ? this.form.plotId : null,
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
      this.form.sowDate = newDateValue;
    },
  },
}
</script>

<style scoped>

</style>