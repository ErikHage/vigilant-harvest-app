<template>
  <v-card>
    <v-card-text>
      <v-table density="compact" height="50vh">
        <thead>
        <tr>
          <th>Name</th>
          <th>Length</th>
          <th>Width</th>
          <th>Type</th>
          <th>Active</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="plot in filteredPlots" :key="plot.plotId">
          <td>{{ plot.friendlyName }}</td>
          <td>{{ plot.lengthInInches }}</td>
          <td>{{ plot.widthInInches }}</td>
          <td>{{ plot.plotType }}</td>
          <td>{{ plot.isActive ? 'Y' : 'N' }}</td>
          <td>
            <v-icon small @click="onEditClicked(plot)">mdi-pencil</v-icon>
          </td>
        </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
  <div class="mt-4">
    <span> {{ filteredPlots.length }} of {{ plots.length }} plots</span>
  </div>
</template>

<script>
import sorting from "@/utils/sorting";

export default {
  name: 'PlotsTable',

  props: {
    plots: {
      type: Array,
    },
    searchFilter: {
      type: String,
    },
    onEditClicked: {
      type: Function,
      required: true,
    },
  },

  data() {
    return {};
  },

  computed: {
    filteredPlots() {
      let filteredPlots = this.plots;

      if (this.searchFilter && this.searchFilter.length > 0) {
        filteredPlots = filteredPlots.filter(
            plot => plot.friendlyName.toUpperCase().includes(this.searchFilter.toUpperCase()));
      }

      return filteredPlots.sort(sorting.sortByPlantFriendlyName);
    }
  }
}
</script>
