<template>
  <v-dialog max-width="500px" persistent>
    <template #activator="{ props }">
      <v-btn v-bind="props" color="error" size="small">
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </template>

    <template #default="{ isActive }">
      <v-card>
        <v-card-title>
          <span class="headline">Delete Schedule Item</span>
        </v-card-title>

        <v-card-text>
          <v-alert v-if="saveError" type="error" density="compact" class="mb-4">{{ saveError }}</v-alert>
          <v-list density="compact" lines="two">
            <v-list-item title="Activity type" :subtitle="scheduleItem.activityType" />
            <v-list-item v-if="scheduleItem.subType" title="Subcategory" :subtitle="scheduleItem.subType" />
            <v-list-item title="Recurrence" :subtitle="recurrenceText(scheduleItem.recurrenceRule)" />
            <v-list-item title="Date(s)" :subtitle="getDateRange(scheduleItem)" />
            <v-list-item v-if="scheduleItem.notes" title="Notes" :subtitle="scheduleItem.notes" />
          </v-list>

          <v-divider class="my-3" />

          <v-switch
              v-model="confirmed"
              color="error"
              label="I want to delete this item"
              hide-details
              density="compact"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn text @click="handleCancel(isActive)">Cancel</v-btn>
          <v-btn color="error" text :disabled="!confirmed" @click="handleDelete(isActive)">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
import { saveFailureMessage } from '@/utils/save-failures';
import scheduling from "@/utils/scheduling";
import { RRule } from 'rrule';

export default {
  name: 'DeleteScheduleItemDialog',

  props: {
    scheduleItem: {
      type: Object,
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
      confirmed: false,
    };
  },

  methods: {
    async handleDelete(isActive) {
      this.saveError = '';
      try {
        await this.onSubmit(this.scheduleItem.entryId);
      } catch (err) {
        this.saveError = saveFailureMessage(err, "Couldn't delete. Try again.");
        return;
      }
      isActive.value = false;
      this.confirmed = false;
    },

    handleCancel(isActive) {
      this.saveError = '';
      isActive.value = false;
      this.confirmed = false;
    },

    getDateRange(scheduleItem) {
      return scheduling.getFormattedDateRange(scheduleItem.startDate, scheduleItem.endDate);
    },

    // as the schedule's page shows it; the service lets an item have no rule
    recurrenceText(recurrenceRule) {
      return recurrenceRule ? RRule.fromString(recurrenceRule).toText() : '';
    },
  },
};
</script>
