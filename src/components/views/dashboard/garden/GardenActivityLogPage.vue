<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <page-title title="Activity Log">
          <template #actions>
            <add-activity-log-entry-dialog
                :activity-types="activityTypes"
                :on-submit="handleNewEntry"
                :on-cancel="() => {}"
            />
          </template>
        </page-title>
        <fade-out-alert :is-visible="alert.isVisible" :alert-type="alert.type" :message="alert.message"/>
      </v-col>
    </v-row>

    <v-select
        v-model="activityTypeFilter"
        :items="activityTypes"
        item-title="name"
        label="Activity"
        variant="outlined"
        density="compact"
        class="activity-filter mb-4"
        return-object
        clearable
        hide-details
    ></v-select>

    <day-timeline
        v-model="selectedDay"
        :records="filteredActivityLogEntries"
        :date-of="entry => entry.entryDate"
    >
      <template #day="{ records }">
        <div
            v-for="(entry, index) in byTime(records)"
            :key="entry.entryId"
            class="activity-entry"
        >
          <div class="d-flex align-center ga-2">
            <v-chip class="activity-type" size="small" color="green-darken-2" variant="flat">{{ entry.activityType }}</v-chip>
            <span v-if="entry.subType" class="activity-subtype">{{ entry.subType }}</span>
          </div>
          <div v-if="entry.comments" class="activity-comments">{{ entry.comments }}</div>
          <v-divider class="my-4" v-if="index < records.length - 1" />
        </div>
      </template>

      <template #empty>
        <p>No activities logged in {{ plantingYear }}.</p>
      </template>
    </day-timeline>
  </v-container>
</template>

<script>
import dayjs from 'dayjs';
import {mapActions, mapState} from "pinia";

import {useActivityLogStore, useCommonStore} from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import AddActivityLogEntryDialog from "@/components/views/dashboard/garden/AddActivityLogEntryDialog.vue";
import DayTimeline from "@/components/utils/DayTimeline.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import { alertOf } from "@/store/alerts";

// An entry's type matches a filter whatever its case: older entries were
// logged as "Fertilize", newer ones as "FERTILIZE"
const ofType = (entry, activityType) => entry.activityType.toUpperCase() === activityType.name;

export default {
  name: "GardenActivityLogPage",

  components: {
    AddActivityLogEntryDialog,
    DayTimeline,
    FadeOutAlert,
    PageTitle,
  },

  data() {
    return {
      activityTypeFilter: null,
      selectedDay: null,
    };
  },

  computed: {
    ...mapState(useCommonStore, {
      plantingYear: 'plantingYear',
    }),

    ...mapState(useActivityLogStore, {
      activityTypes: 'activityTypes',
      activityLogEntries: 'activityLogEntries',
    }),

    alert() {
      return alertOf(useActivityLogStore());
    },

    filteredActivityLogEntries() {
      if (this.activityTypeFilter) {
        return this.activityLogEntries.filter(entry => ofType(entry, this.activityTypeFilter));
      }

      return this.activityLogEntries;
    }
  },

  methods: {
    ...mapActions(useActivityLogStore, [
      'upsertActivityLogEntry',
      'fetchActivityLogEntriesByYear',
    ]),

    async refreshData() {
      await this.fetchActivityLogEntriesByYear(this.plantingYear);
    },

    // The day's entries by their time, then as recorded: the service sends
    // them in no set order. entryDate is local, YYYY-MM-DDTHH:mm:ss, so sorts
    // as text
    byTime(entries) {
      return [...entries].sort((a, b) =>
          a.entryDate.localeCompare(b.entryDate) || a.dateCreated.localeCompare(b.dateCreated));
    },

    // Goes to the new entry's day, clearing a filter that would hide it
    async handleNewEntry(entry) {
      await this.upsertActivityLogEntry({
        plantingYear: this.plantingYear,
        ...entry,
      });
      await this.refreshData();
      if (this.activityTypeFilter && !ofType(entry, this.activityTypeFilter)) {
        this.activityTypeFilter = null;
      }
      this.selectedDay = dayjs(entry.entryDate).format('YYYY-MM-DD');
    }
  },

  async mounted() {
    await this.refreshData();
  }
}
</script>

<style scoped>
.activity-filter {
  max-width: 240px;
}

.activity-subtype {
  font-weight: bold;
}

.activity-comments {
  margin-top: 6px;
  white-space: pre-wrap;
}
</style>
