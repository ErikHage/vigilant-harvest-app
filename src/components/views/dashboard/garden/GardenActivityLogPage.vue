<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Garden Activity Log"/>
        <add-activity-log-entry-dialog
            :activity-types="activityTypes"
            :on-submit="handleNewEntry"
            :on-cancel="() => {}"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <pre>
        {{ JSON.stringify(this.activityLogEntries, null, 2) }}
        </pre>
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
      selectedDate: null,
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
