<template>
  <v-table>
    <thead>
    <tr>
<!--      TODO add links to planting details page -->
      <th class="text-left">Planting Name</th>
      <th class="text-left">Plant Name</th>
      <th class="text-left">{{ actionDayTitle }}</th>
      <th class="text-left">Days Until</th>
    </tr>
    </thead>

    <tbody>
    <tr v-for="item in items" :key="item.plantingId">
      <td>{{ item.plantingName }}</td>
      <td>{{ item.plantName }}</td>
      <td>
        {{ formatActionDate(item) }}
      </td>
      <td>
        <span :class="daysUntilActionColor(item.daysUntilAction)">
          {{ item.daysUntilAction ?? '—' }}
        </span>
      </td>
    </tr>
    </tbody>
  </v-table>
</template>

<script>
import dayjs from 'dayjs';

export default {
  props: {
    items: {
      type: Array,
      required: true
    },
    year: {
      type: String,
      required: true,
    },
    actionDayTitle: {
      type: String,
      default: 'Action Day',
    },
  },
  methods: {
    formatActionDate(item) {
      if (!item.plannedActionDay) return '—';

      return dayjs(`${this.year}-01-01`)
          .add(item.plannedActionDay - 1, 'day')
          .format('MMM D');
    },

    daysUntilActionColor(days) {
      if (days == null) return 'text-grey';
      if (days <= 0) return 'text-error';
      if (days <= 7) return 'text-warning';
      if (days <= 30) return 'text-primary';
      return 'text-success';
    }
  }
}
</script>
