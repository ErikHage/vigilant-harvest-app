<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Garden Journal"/>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="2" class="timeline-column d-flex flex-column">
        <div class="add-entry-wrapper mb-2 text-center">
          <add-journal-entry-dialog
              :on-submit="handleNewEntry"
              :on-cancel="() => {}"
          />
        </div>

        <div class="timeline flex-grow-1 overflow-y-auto">
          <div
              v-for="(item, index) in timelineItems"
              :key="index"
              class="timeline-entry"
              :class="{ selected: selectedDate === item.date, gap: item.gap }"
              @click="selectDate(item.date)"
          >
            <span v-if="item.gap">...</span>
            <span v-else>{{ formatDate(item.date) }}</span>
          </div>
        </div>
      </v-col>

      <v-col cols="10" class="content-column">
        <div class="content-area" v-if="selectedEntries.length">
          <div class="navigation-buttons d-flex justify-space-between mb-4">
            <v-btn
                variant="tonal"
                :disabled="!previousDate"
                @click="selectDate(previousDate)"
                prepend-icon="mdi-chevron-left"
            >
              Previous
            </v-btn>
            <h2>{{ formatDate(selectedDate) }}</h2>
            <v-btn
                variant="tonal"
                :disabled="!nextDate"
                @click="selectDate(nextDate)"
                append-icon="mdi-chevron-right"
            >
              Next
            </v-btn>
          </div>
          <v-divider class="my-4" />

          <div
              v-for="(entry, index) in selectedEntries"
              :key="index"
              class="journal-entry respect-formatting"
          >
            <p>{{ entry.entry }}</p>
            <v-divider class="my-4" v-if="index < selectedEntries.length - 1" />
          </div>
        </div>

        <div class="content-area" v-else>
          <p>No entry selected.</p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import dayjs from 'dayjs';
import {mapActions, mapState} from "pinia";

import {useCommonStore, useJournalStore} from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import AddJournalEntryDialog from "@/components/views/dashboard/garden/AddJournalEntryDialog.vue";

export default {
  name: "GardenJournalPage",

  components: {
    AddJournalEntryDialog,
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

    ...mapState(useJournalStore, {
      journalEntries: 'journalEntries',
    }),

    groupedEntries() {
      return this.journalEntries.reduce((groups, entry) => {
        const dateOnly = dayjs(entry.entryDate).format('YYYY-MM-DD');
        if (!groups[dateOnly]) groups[dateOnly] = [];
        groups[dateOnly].push(entry);
        return groups;
      }, {});
    },

    sortedDates() {
      return Object.keys(this.groupedEntries).sort(
          (a, b) => dayjs(a).unix() - dayjs(b).unix()
      );
    },

    timelineItems() {
      const items = [];
      const dates = this.sortedDates;

      for (let i = 0; i < dates.length; i++) {
        items.push({ date: dates[i], gap: false });

        if (i < dates.length - 1) {
          const current = dayjs(dates[i]);
          const next = dayjs(dates[i + 1]);
          const diffDays = next.diff(current, 'day');
          if (diffDays > 1) {
            items.push({ gap: true });
          }
        }
      }

      return items;
    },

    selectedEntries() {
      return this.groupedEntries[this.selectedDate] || [];
    },

    previousDate() {
      const index = this.sortedDates.indexOf(this.selectedDate);
      return index > 0 ? this.sortedDates[index - 1] : null;
    },

    nextDate() {
      const index = this.sortedDates.indexOf(this.selectedDate);
      return index < this.sortedDates.length - 1 ? this.sortedDates[index + 1] : null;
    }
  },

  methods: {
    ...mapActions(useJournalStore, [
      'upsertJournalEntry',
      'fetchJournalEntriesByYear',
    ]),

    async refreshData() {
      await this.fetchJournalEntriesByYear(this.plantingYear);
      const firstDate = this.sortedDates[0];
      if (firstDate) this.selectedDate = firstDate;
    },

    selectDate(date) {
      if (date) this.selectedDate = date;
    },

    formatDate(date) {
      return dayjs(date).format('YYYY-MM-DD');
    },

    async handleNewEntry(entry) {
      await this.upsertJournalEntry({
        plantingYear: this.plantingYear,
        ...entry,
      });
      await this.refreshData();
      this.selectedDate = entry.entryDate.format('YYYY-MM-DD');
    }
  },

  async mounted() {
    await this.refreshData();
  }
}
</script>

<style scoped>
.timeline-column {
  max-height: 70vh;
  overflow: hidden; /* stop outer scroll */
  border-right: 1px solid #ccc;
}

.timeline {
  overflow-y: auto;
  flex-grow: 1;
  padding: 10px;
}

.timeline-entry {
  cursor: pointer;
  padding: 8px 12px;
  margin: 0;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 14px;
}

.timeline-entry.selected {
  background-color: darkgreen;
  color: white;
  font-weight: bold;
  transform: scale(1.05);
}

.timeline-entry.gap {
  color: #888;
  text-align: center;
  cursor: default;
}

.content-column {
  max-height: 75vh;
  overflow-y: auto;
  padding: 20px;
}

.content-area {
  white-space: pre-wrap;
}

.journal-entry {
  margin-bottom: 20px;
}

.respect-formatting {
  white-space: pre-wrap;
}

.add-entry-wrapper {
  border-bottom: 1px solid #ccc;
  padding-bottom: 10px;
}
</style>
