<template>
  <v-card>
    <v-card-text>
      <v-table density="compact" height="50vh">
        <thead>
        <tr>
          <th>Name</th>
          <th>Plant</th>
          <th>Plot</th>
          <th>Status</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="planting in hydratedPlantings">
          <td>{{ planting.name }}</td>
          <td>{{ planting.plantName }}</td>
          <td>{{ planting.plotName }}</td>
          <td>
            <v-chip size="small" :color="getStatusColor(planting.currentStatus)">{{ planting.currentStatus }}</v-chip>
          </td>
          <td>
            <v-icon @click="onViewClicked(planting)">mdi-magnify</v-icon>
          </td>
        </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
  <div class="mt-4">
    <span> {{ hydratedPlantings.length }} of {{ plantings.length }} plantings</span>
  </div>
</template>

<script>
import plantingUtils from '@/utils/plantings'

export default {
  name: 'PlantingsTable',

  props: {
    plotsMap: {
      type : Object,
    },
    plantsMap: {
      type: Object,
    },
    plantings: {
      type: Array,
    },
    filter: {
      type: String,
    },
    statusFilter: {
      type: String,
    },
    onViewClicked: {
      type: Function,
    },
    onEditClicked: {
      type: Function,
    },
  },

  data() {
    return {};
  },

  computed: {
    hydratedPlantings() {
      if (this.plantings.length > 0 && Object.keys(this.plotsMap).length > 0) {
        let filteredPlantings = this.plantings
            .map(planting => {
              const plant = this.plantsMap[planting.plantId];
              const plot = this.plotsMap[planting.plotId];
              return {
                ...planting,
                plantName: plant.friendlyName,
                plotName: plot?.friendlyName,
              };
            });

        if (this.filter) {
          filteredPlantings = filteredPlantings.filter(planting => {
            const matchString = planting.name.toUpperCase()
                + planting.plantName.toUpperCase()
                + (planting.plotName?.toUpperCase() ?? "");
            return matchString.includes(this.filter.toUpperCase());
          });
        }

        if (this.statusFilter) {
          filteredPlantings = filteredPlantings.filter(planting => planting.currentStatus === this.statusFilter);
        }

        return filteredPlantings;
      }
      return [];
    },
  },

  methods: {
    getStatusColor(value) {
      return plantingUtils.mapPlantingStatusToColor(value);
    }
  },
}
</script>

<style scoped>

</style>