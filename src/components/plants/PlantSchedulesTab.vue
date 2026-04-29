<template>
  <v-table>
    <thead>
    <tr>
      <th>Schedule</th>
      <th>Description</th>
    </tr>
    </thead>
    <tbody>
    <tr v-for="schedule in plant.activitySchedules" :key="schedule.activityScheduleId">
      <td>{{ schedule.name }}</td>
      <td>{{ schedule.description }}</td>
    </tr>
    </tbody>
  </v-table>
</template>

<script>
export default {
  name: "PlantSchedulesTab",

  props: {
    plant: Object,
  },
}
</script>
