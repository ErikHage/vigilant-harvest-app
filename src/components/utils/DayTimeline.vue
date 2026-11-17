<template>
  <v-row>
    <v-col cols="2" class="timeline-column d-flex flex-column">
      <div class="timeline flex-grow-1 overflow-y-auto">
        <div
            v-for="(item, index) in timelineItems"
            :key="index"
            class="timeline-entry"
            :class="{ selected: !item.gap && item.day === shownDay, gap: item.gap }"
            @click="choose(item.day)"
        >
          {{ item.gap ? '...' : item.day }}
        </div>
      </div>
    </v-col>

    <v-col cols="10" class="content-column">
      <div v-if="shownDay">
        <div class="d-flex justify-space-between align-center">
          <v-btn
              variant="tonal"
              :disabled="!olderDay"
              @click="choose(olderDay)"
              prepend-icon="mdi-chevron-left"
          >
            Older
          </v-btn>
          <div class="d-flex align-center ga-3">
            <h2>{{ shownDay }}</h2>
            <slot name="actions" :day="shownDay" :records="recordsByDay[shownDay]"/>
          </div>
          <v-btn
              variant="tonal"
              :disabled="!newerDay"
              @click="choose(newerDay)"
              append-icon="mdi-chevron-right"
          >
            Newer
          </v-btn>
        </div>
        <v-divider class="my-4"/>

        <slot name="day" :day="shownDay" :records="recordsByDay[shownDay]"/>
      </div>

      <slot v-else name="empty"/>
    </v-col>
  </v-row>
</template>

<script>
import dayjs from 'dayjs';

// A timeline of the days that have records, newest first, and the chosen
// day's records. The page owns the chosen day, through v-model; when it names
// no day with records, the newest is shown, and the page told
export default {
  name: 'DayTimeline',

  props: {
    records: { type: Array, required: true },
    // A record's date: read as the local day it falls on
    dateOf: { type: Function, required: true },
    modelValue: { type: String, default: null },
  },

  emits: ['update:modelValue'],

  computed: {
    recordsByDay() {
      return this.records.reduce((byDay, record) => {
        const day = dayjs(this.dateOf(record)).format('YYYY-MM-DD');
        (byDay[day] ??= []).push(record);
        return byDay;
      }, {});
    },

    // YYYY-MM-DD sorts as text
    days() {
      return Object.keys(this.recordsByDay).sort().reverse();
    },

    // A gap between days more than one apart
    timelineItems() {
      return this.days.flatMap((day, i) => {
        const next = this.days[i + 1];
        const apart = next && dayjs(day).diff(dayjs(next), 'day') > 1;
        return apart ? [{ day }, { gap: true }] : [{ day }];
      });
    },

    shownDay() {
      return this.recordsByDay[this.modelValue] ? this.modelValue : (this.days[0] ?? null);
    },

    // days runs newest first, as the timeline does
    olderDay() {
      return this.days[this.days.indexOf(this.shownDay) + 1] ?? null;
    },

    newerDay() {
      const index = this.days.indexOf(this.shownDay);
      return index > 0 ? this.days[index - 1] : null;
    },
  },

  watch: {
    shownDay: {
      handler(day) {
        if (day !== this.modelValue) this.$emit('update:modelValue', day);
      },
      immediate: true,
    },
  },

  methods: {
    choose(day) {
      if (day) this.$emit('update:modelValue', day);
    },
  },
};
</script>

<style scoped>
.timeline-column {
  max-height: 70vh;
  overflow: hidden;
  border-right: 1px solid #ccc;
}

.timeline {
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
  pointer-events: none;
  color: #888;
  text-align: center;
  font-style: italic;
  margin: 4px 0;
}

.content-column {
  max-height: 75vh;
  overflow-y: auto;
  padding: 20px;
}
</style>
