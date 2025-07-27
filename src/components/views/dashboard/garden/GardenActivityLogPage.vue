<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Activity Log"/>
        <v-spacer></v-spacer>
        <add-activity-log-entry-dialog
            :activity-types="activityTypes"
            :on-submit="handleNewEntry"
            :on-cancel="() => {}"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            <v-select
                v-model="activityTypeFilter"
                :items="activityTypes"
                item-title="name"
                label="Activity"
                variant="solo"
                return-object
                clearable
            ></v-select>
          </v-card-title>
          <v-card-text>
            <v-data-table
                :headers="headers"
                :items="filteredActivityLogEntries"
                item-value="entryId"
                :sort-by="sortBy"
                class="elevation-1"
                density="compact"
            >
              <template #item.entryDate="{ item }">
                {{ formatDate(item.entryDate) }}
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import dayjs from 'dayjs';
import {mapActions, mapState} from "pinia";

import {useActivityLogStore, useCommonStore} from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import AddActivityLogEntryDialog from "@/components/views/dashboard/garden/AddActivityLogEntryDialog.vue";
import AddJournalEntryDialog from "@/components/views/dashboard/garden/AddJournalEntryDialog.vue";

export default {
  name: "GardenActivityLogPage",

  components: {
    AddJournalEntryDialog,
    AddActivityLogEntryDialog,
    PageTitle,
  },

  data() {
    return {
      activityTypeFilter: null,
      sortBy: [
        { key: 'entryDate', order: 'desc' }
      ],
      headers: [
        {title: 'Date', key: 'entryDate'},
        {title: 'Type', key: 'activityType'},
        {title: 'Sub-Type', key: 'subType'},
        {title: 'Comments', key: 'comments'}
      ],
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

    filteredActivityLogEntries() {
      if (this.activityTypeFilter) {
        return this.activityLogEntries
            .filter(entry => entry.activityType.toUpperCase() === this.activityTypeFilter.name);
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

    formatDate(date) {
      return dayjs(date).format('YYYY-MM-DD');
    },

    async handleNewEntry(entry) {
      await this.upsertActivityLogEntry({
        plantingYear: this.plantingYear,
        ...entry,
      });
      await this.refreshData();
    }
  },

  async mounted() {
    await this.refreshData();
  }
}
</script>

<style scoped>
</style>
