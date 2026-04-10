<template>
  <v-dialog max-width="500px" persistent>
    <template #activator="{ props }">
      <v-btn v-bind="props" color="primary" size="small">
        <v-icon left>mdi-plus</v-icon>
        Add Item
      </v-btn>
    </template>

    <template #default="{ isActive }">
      <v-card>
        <v-card-title>
          <span class="headline">Add Activity Schedule Item</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="scheduleForm">
            <v-select
                v-model="form.activityType"
                :items="activityTypes"
                item-title="name"
                item-value="id"
                label="Activity Type"
                density="compact"
                variant="solo"
                return-object
                @update:model-value="clearSubtype"
            ></v-select>

            <v-select
                v-model="form.subType"
                :items="activitySubTypes"
                item-title="name"
                item-value="id"
                label="Subcategory"
                density="compact"
                variant="solo"
                :disabled="form.activityType == null"
                return-object
            ></v-select>

            <v-select
                v-model="form.frequency"
                :items="frequencies"
                label="Frequency"
                density="compact"
                variant="solo"
            ></v-select>

            <v-text-field
                v-model.number="form.interval"
                type="number"
                label="Interval"
                variant="solo"
                density="compact"/>

            <p>Start Date</p>
            <div class="d-flex align-center">
              <date-picker-dialog-day-js
                  :on-submit="setStartDate"
                  title="Start Date"
                  :date="form.startDate"/>
              <h3 class="ml-2">{{ formattedStartDate }}</h3>
            </div>

            <div class="pt-4">
              <p>End Date</p>
              <div class="d-flex align-center">
                <date-picker-dialog-day-js
                    :on-submit="setEndDate"
                    title="End Date"
                    :date="form.endDate"/>
                <h3 class="ml-2">{{ formattedEndDate }}</h3>
              </div>
            </div>

            <v-textarea
                v-model="form.notes"
                class="pt-4"
                label="Notes"
                density="compact"
                variant="solo"
                required
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="handleOnCancel(isActive)">Cancel</v-btn>
          <v-btn color="primary" text :disabled="isCreateDisabled" @click="handleSaveItem(isActive)">Create</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
import DatePickerDialogDayJs from "@/components/utils/DatePickerDialogDayJs.vue";
import scheduling from '@/utils/scheduling';

export default {
  name: "AddScheduleItemDialog",

  components: {
    DatePickerDialogDayJs,
  },

  props: {
    activityTypes: {
      type: Array,
      required: true,
    },
    onSubmit: {
      type: Function,
      default: () => {},
    },
  },

  data() {
    return {
      form: {
        activityType: null,
        subType: null,
        frequency: null,
        interval: 1,
        startDate: null,
        endDate: null,
        notes: null,
      },
    }
  },

  computed: {
    frequencies() {
      return scheduling.iCal.frequencies;
    },

    activitySubTypes() {
      if (this.form.activityType != null) {
        return this.form.activityType.subTypes;
      }
      return [];
    },

    formattedStartDate() {
      return this.form.startDate ?
          this.form.startDate.format('YYYY-MM-DD') :
          '--';
    },

    formattedEndDate() {
      return this.form.endDate ?
          this.form.endDate.format('YYYY-MM-DD') :
          '--';
    },

    isCreateDisabled() {
      return !this.form.activityType ||
          !this.form.subType ||
          !this.form.frequency ||
          !this.form.interval ||
          !this.form.startDate ||
          !this.form.endDate ||
          !this.form.notes;
    },
  },

  methods: {
    resetForm() {
      this.form = {
        activityType: null,
        subType: null,
        frequency: null,
        interval: 1,
        startDate: null,
        endDate: null,
        notes: null,
      };
    },

    clearSubtype() {
      this.form.subType = null;
    },

    async handleSaveItem(isActive) {
      await this.onSubmit({
        activityType: this.form.activityType.name,
        subType: this.form.subType.name,
        recurrenceRule: `FREQ=${this.form.frequency};INTERVAL=${this.form.interval}`,
        startDate: this.form.startDate,
        endDate: this.form.endDate,
        notes: this.form.notes,
      });
      this.resetForm();
      isActive.value = false;
    },

    handleOnCancel(isActive) {
      this.resetForm();
      isActive.value = false;
    },

    setStartDate(date) {
      this.form.startDate = date;
    },

    setEndDate(date) {
      this.form.endDate = date;
    },
  },
}
</script>
