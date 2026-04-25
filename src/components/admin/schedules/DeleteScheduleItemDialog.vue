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
          <v-list density="compact" lines="two">
            <v-list-item title="Activity type" :subtitle="scheduleItem.activityType" />
            <v-list-item v-if="scheduleItem.subType" title="Subcategory" :subtitle="scheduleItem.subType" />
            <v-list-item title="Recurrence" :subtitle="scheduleItem.recurrenceRule" />
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
import scheduling from "@/utils/scheduling";

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
      confirmed: false,
    };
  },

  methods: {
    async handleDelete(isActive) {
      await this.onSubmit(this.scheduleItem.entryId);
      isActive.value = false;
      this.confirmed = false;
    },

    handleCancel(isActive) {
      isActive.value = false;
      this.confirmed = false;
    },

    getDateRange(scheduleItem) {
      return scheduling.getFormattedDateRange(scheduleItem.startDate, scheduleItem.endDate);
    },
  },
};
</script>
