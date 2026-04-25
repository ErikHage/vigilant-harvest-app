<template>
  <div class="d-flex align-center ga-2">
    <v-select
        v-model="selectedMonth"
        :items="months"
        item-title="label"
        item-value="value"
        :label="monthLabel"
        density="compact"
        variant="solo"
        style="min-width: 140px"
        @update:model-value="handleMonthChange"
    />
    <v-select
        v-model="selectedDay"
        :items="days"
        :label="dayLabel"
        density="compact"
        variant="solo"
        :disabled="!selectedMonth"
        style="min-width: 90px"
        @update:model-value="emitValue"
    />
  </div>
</template>

<script>
export default {
  name: 'MonthDaySelect',

  props: {
    modelValue: {
      type: String,
      default: null,
    },
    monthLabel: {
      type: String,
      default: 'Month',
    },
    dayLabel: {
      type: String,
      default: 'Day',
    },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      selectedMonth: null,
      selectedDay: null,
      months: [
        { label: 'January',   value: '01', days: 31 },
        { label: 'February',  value: '02', days: 28 },
        { label: 'March',     value: '03', days: 31 },
        { label: 'April',     value: '04', days: 30 },
        { label: 'May',       value: '05', days: 31 },
        { label: 'June',      value: '06', days: 30 },
        { label: 'July',      value: '07', days: 31 },
        { label: 'August',    value: '08', days: 31 },
        { label: 'September', value: '09', days: 30 },
        { label: 'October',   value: '10', days: 31 },
        { label: 'November',  value: '11', days: 30 },
        { label: 'December',  value: '12', days: 31 },
      ],
    };
  },

  computed: {
    days() {
      if (!this.selectedMonth) return [];
      const month = this.months.find(m => m.value === this.selectedMonth);
      return Array.from({ length: month.days }, (_, i) => String(i + 1).padStart(2, '0'));
    },
  },

  methods: {
    handleMonthChange() {
      const maxDay = this.months.find(m => m.value === this.selectedMonth)?.days;
      if (this.selectedDay && parseInt(this.selectedDay) > maxDay) {
        this.selectedDay = null;
      }
      this.emitValue();
    },

    emitValue() {
      const value = this.selectedMonth && this.selectedDay
          ? `${this.selectedMonth}-${this.selectedDay}`
          : null;
      this.$emit('update:modelValue', value);
    },

    initFromValue(val) {
      if (val && val.length === 5) {
        this.selectedMonth = val.substring(0, 2);
        this.selectedDay = val.substring(3, 5);
      } else {
        this.selectedMonth = null;
        this.selectedDay = null;
      }
    },
  },

  watch: {
    modelValue: {
      immediate: true,
      handler(newVal) {
        this.initFromValue(newVal);
      },
    },
  },
};
</script>
