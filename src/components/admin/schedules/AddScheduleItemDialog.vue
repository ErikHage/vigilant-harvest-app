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
            <month-day-select
                v-model="form.startDate"
                month-label="Month"
                day-label="Day"/>
            <v-select
                v-model="form.startDateYearOffset"
                :items="yearOffsets"
                item-title="label"
                item-value="value"
                label="Year Offset"
                density="compact"
                variant="solo"/>

            <p>End Date</p>
            <month-day-select
                v-model="form.endDate"
                class="pt-4"
                month-label="Month"
                day-label="Day"/>
            <v-select
                v-model="form.endDateYearOffset"
                :items="yearOffsets"
                item-title="label"
                item-value="value"
                label="Year Offset"
                density="compact"
                variant="solo"/>

            <v-textarea
                v-model="form.notes"
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
import MonthDaySelect from "@/components/utils/MonthDaySelect.vue";
import {RRule} from "rrule";

export default {
  name: "AddScheduleItemDialog",

  components: {
    MonthDaySelect,
    DatePickerDialogDayJs,
  },

  props: {
    activityTypes: {
      type: Array,
      required: true,
    },
    onSubmit: {
      type: Function,
      default: () => {
      },
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
        startDateYearOffset: 0,
        endDate: null,
        endDateYearOffset: 0,
        notes: null,
      },
    }
  },

  computed: {
    frequencies() {
      return scheduling.iCal.frequencies;
    },

    yearOffsets() {
      return scheduling.yearOffset.items;
    },

    activitySubTypes() {
      if (this.form.activityType != null) {
        return this.form.activityType.subTypes;
      }
      return [];
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
        startDateYearOffset: 0,
        endDate: null,
        endDateYearOffset: 0,
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
        recurrenceRule: this.toRecurrenceRuleString(this.form.frequency, this.form.interval),
        startDate: this.form.startDate,
        startDateYearOffset: this.form.startDateYearOffset,
        endDate: this.form.endDate,
        endDateYearOffset: this.form.endDateYearOffset,
        notes: this.form.notes,
      });
      this.resetForm();
      isActive.value = false;
    },

    handleOnCancel(isActive) {
      this.resetForm();
      isActive.value = false;
    },

    toRecurrenceRuleString(frequency, interval) {
      return new RRule({
        freq: scheduling.iCal.labelToRRuleFrequency(frequency),
        interval: interval,
      }).toString();
    },
  },
}
</script>
