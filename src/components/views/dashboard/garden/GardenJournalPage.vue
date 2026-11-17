<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <page-title title="Garden Journal">
          <template #actions>
            <add-journal-entry-dialog
                :on-submit="handleNewEntry"
                :on-cancel="() => {}"
            />
          </template>
        </page-title>
        <fade-out-alert :is-visible="alert.isVisible" :alert-type="alert.type" :message="alert.message"/>
      </v-col>
    </v-row>

    <day-timeline
        v-model="selectedDay"
        :records="journalEntries"
        :date-of="entry => entry.entryDate"
    >
      <template #day="{ records }">
        <div
            v-for="(entry, index) in byTime(records)"
            :key="index"
            class="journal-entry respect-formatting"
        >
          <p>{{ entry.entry }}</p>
          <v-divider class="my-4" v-if="index < records.length - 1" />
        </div>
      </template>

      <template #empty>
        <p>No entry selected.</p>
      </template>
    </day-timeline>
  </v-container>
</template>

<script>
import dayjs from 'dayjs';
import {mapActions, mapState} from "pinia";

import {useCommonStore, useJournalStore} from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import AddJournalEntryDialog from "@/components/views/dashboard/garden/AddJournalEntryDialog.vue";
import DayTimeline from "@/components/utils/DayTimeline.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import { alertOf } from "@/store/alerts";

export default {
  name: "GardenJournalPage",

  components: {
    AddJournalEntryDialog,
    DayTimeline,
    FadeOutAlert,
    PageTitle,
  },

  data() {
    return {
      selectedDay: null,
    };
  },

  computed: {
    ...mapState(useCommonStore, {
      plantingYear: 'plantingYear',
    }),

    ...mapState(useJournalStore, {
      journalEntries: 'journalEntries',
    }),

    alert() {
      return alertOf(useJournalStore());
    },
  },

  methods: {
    ...mapActions(useJournalStore, [
      'upsertJournalEntry',
      'fetchJournalEntriesByYear',
    ]),

    async refreshData() {
      await this.fetchJournalEntriesByYear(this.plantingYear);
    },

    // The day's entries by their time, then as recorded: the service sends
    // them in no set order. entryDate is local, YYYY-MM-DDTHH:mm:ss, so sorts
    // as text
    byTime(entries) {
      return [...entries].sort((a, b) =>
          a.entryDate.localeCompare(b.entryDate) || a.dateCreated.localeCompare(b.dateCreated));
    },

    async handleNewEntry(entry) {
      await this.upsertJournalEntry({
        plantingYear: this.plantingYear,
        ...entry,
      });
      await this.refreshData();
      this.selectedDay = dayjs(entry.entryDate).format('YYYY-MM-DD');
    }
  },

  async mounted() {
    await this.refreshData();
  }
}
</script>

<style scoped>
.journal-entry {
  margin-bottom: 20px;
}

.respect-formatting {
  white-space: pre-wrap;
}
</style>
