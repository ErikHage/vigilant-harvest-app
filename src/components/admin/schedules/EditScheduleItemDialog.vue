<template>
  <v-dialog max-width="500px" persistent>
    <template #activator="{ props }">
      <v-btn v-bind="props" color="primary" size="small">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </template>

    <template #default="{ isActive }">
      <v-card>
        <v-card-title>
          <span class="headline">Edit Activity Schedule Item</span>
        </v-card-title>
        <v-card-text>
          <v-alert v-if="saveError" type="error" density="compact" class="mb-4">{{ saveError }}</v-alert>
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
          <v-btn color="primary" text :disabled="isUpdateDisabled" @click="handleUpdateItem(isActive)">Save</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
import { saveFailureMessage } from '@/utils/save-failures';
import scheduling from '@/utils/scheduling';
import { RRule } from 'rrule';
import MonthDaySelect from "@/components/utils/MonthDaySelect.vue";
import { isWholeNumber } from '@/utils/form-rules';

export default {
  name: "EditScheduleItemDialog",

  components: {
    MonthDaySelect,
  },

  props: {
    scheduleItem: {
      type: Object,
      required: true,
    },
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
      saveError: '',
      form: {
        entryId: null,
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

    activitySubTypes() {
      if (this.form.activityType != null) {
        return this.form.activityType.subTypes;
      }
      return [];
    },

    yearOffsets() {
      return scheduling.yearOffset.items;
    },

    // the service requires a type; the rule and the dates are the app's. A
    // subtype and notes are optional, as they are to the service
    isUpdateDisabled() {
      return !this.form.entryId ||
          !this.form.activityType ||
          !this.form.frequency ||
          !isWholeNumber(this.form.interval, 1) ||
          !this.form.startDate ||
          !this.form.endDate;
    },
  },

  methods: {
    resetForm(scheduleItem) {
      const rule = this.fromRecurrenceRule(scheduleItem.recurrenceRule);
      const activityType = this.activityTypes.find(t => t.name === scheduleItem.activityType) ?? null;
      this.form = {
        entryId: scheduleItem.entryId,
        activityType: activityType,
        subType: activityType?.subTypes?.find(s => s.name === scheduleItem.subType) ?? null,
        frequency: rule.frequency,
        interval: rule.interval,
        startDate: scheduleItem.startDate,
        startDateYearOffset: scheduleItem.startDateYearOffset,
        endDate: scheduleItem.endDate,
        endDateYearOffset: scheduleItem.endDateYearOffset,
        notes: scheduleItem.notes,
      };
    },

    clearSubtype() {
      this.form.subType = null;
    },

    async handleUpdateItem(isActive) {
      this.saveError = '';
      try {
        await this.onSubmit({
          entryId: this.form.entryId,
          activityType: this.form.activityType.name,
          subType: this.form.subType?.name ?? null,
          recurrenceRule: this.toRecurrenceRuleString(this.form.frequency, this.form.interval),
          startDate: this.form.startDate,
          startDateYearOffset: this.form.startDateYearOffset,
          endDate: this.form.endDate,
          endDateYearOffset: this.form.endDateYearOffset,
          notes: this.form.notes,
        });
      } catch (err) {
        this.saveError = saveFailureMessage(err);
        return;
      }
      isActive.value = false;
    },

    // back to the item, so the next open doesn't show a cancelled edit
    handleOnCancel(isActive) {
      this.saveError = '';
      this.resetForm(this.scheduleItem);
      isActive.value = false;
    },

    toRecurrenceRuleString(frequency, interval) {
      return new RRule({
        freq: scheduling.iCal.labelToRRuleFrequency(frequency),
        interval: interval,
      }).toString();
    },

    fromRecurrenceRule(recurrenceRule) {
      const rule = RRule.fromString(recurrenceRule);
      return {
        frequency: scheduling.iCal.rRuleFrequencyToLabel(rule.options.freq),
        interval: rule.options.interval,
      };
    }
  },

  watch: {
    scheduleItem: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.resetForm(newVal);
        }
      },
    },
    activityTypes: {
      handler(newVal) {
        if (newVal?.length && this.scheduleItem) this.resetForm(this.scheduleItem);
      },
    },
  }
}
</script>
