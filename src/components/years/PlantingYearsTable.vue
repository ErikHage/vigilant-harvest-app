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
          <td>{{ year.targetPlantingDate }}</td>
          <td>{{ year.lastFrostDate }}</td>
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

  data() {
    return {};
  },

  computed: {

  },

  methods: {

  },
}
</script>

<style scoped>

</style>
