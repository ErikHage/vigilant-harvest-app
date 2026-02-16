<template>
  <v-card>
    <v-card-text>
      <v-table density="compact" height="50vh">
        <thead>
        <tr>
          <th>Year</th>
          <th>Target Planting Date</th>
          <th>Last Frost Date</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="year in plantingYears">
          <td>{{ year.plantingYear }}</td>
          <td>{{ formatDateString(year.targetPlantingDate) }}</td>
          <td>{{ formatDateString(year.lastFrostDate) }}</td>
          <td>
            <v-icon @click="onViewClicked(year)">mdi-magnify</v-icon>
          </td>
        </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script>
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export default {
  name: 'PlantingsYearsTable',

  props: {
    plantingYears: {
      type: Array,
      default: () => [],
    },
    onViewClicked: {
      type: Function,
    },
  },

  methods: {
    formatDateString(dateString) {
      return dayjs.utc(dateString).format('MMM D');
    },
  },
}
</script>

<style scoped>

</style>
