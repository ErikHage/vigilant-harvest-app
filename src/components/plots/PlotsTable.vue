<template>
  <v-card>
    <v-card-text>
      <v-data-table
          :headers="headers"
          :items="filteredPlots"
          item-key="plotId"
          class="elevation-1"
          density="compact"
      >
        <template #item.actions="{ item }">
          <v-icon small @click="onEditClicked(item)">mdi-pencil</v-icon>
          <!-- TODO add enable/disable button, with confirm dialog. -->
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script>
  import sorting from "@/utils/sorting";

  export default {
    name: 'PlotsTable',

    props: {
      plots: Array,
      onEditClicked: Function,
    },

    data: () => ({
      headers: [
        {title: 'Name', key: 'friendlyName'},
        {title: 'Length (in.)', key: 'lengthInInches'},
        {title: 'Width (in.)', key: 'widthInInches'},
        {title: 'Type', key: 'plotType'},
        {title: 'Active', key: 'isActive', value: (item) => item.isActive ? 'Y' : 'N' },
        {title: 'Actions', key: 'actions', sortable: false},
      ],
    }),

    computed: {
      filteredPlots() {
        return this.plots.sort(sorting.sortByPlantFriendlyName);
      }
    }
  }
</script>
