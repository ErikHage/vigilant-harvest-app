<template>
  <v-card>
    <v-card-text>
      <v-data-table
          class="elevation-1 align-left"
          :headers="headers"
          :items="hydratedPlantings"
          item-key="plantingId"
          density="compact"
      >
        <template #item.currentStatus="{ item }">
          <v-chip size="small" :color="getStatusColor(item.currentStatus)">{{ item.currentStatus }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-icon @click="onViewClicked(item)">mdi-magnify</v-icon>
          <!-- TODO add delete button, with confirm dialog. only admin can see/use it -->
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script>
import plantingUtils from '@/utils/plantings'

export default {
  name: 'PlantingsTable',

  props: {
    plotsMap: Object,
    plantsMap: Object,
    plantings: Array,
    onViewClicked: Function,
    onEditClicked: Function,
  },

  data: () => ({
    headers: [
      { title: 'Name', key: 'name', align: 'start', },
      { title: 'Plant', key: 'plantName', align: 'start', },
      { title: 'Plot', key: 'plotName', align: 'start', },
      { title: 'Status', key: 'currentStatus', align: 'start', },
      { title: 'Actions', key: 'actions', sortable: false },
    ],
  }),

  computed: {
    hydratedPlantings() {
      if (this.plantings.length > 0 && Object.keys(this.plotsMap).length > 0) {
        return this.plantings.map(planting => {
          const plant = this.plantsMap[planting.plantId];
          const plot = this.plotsMap[planting.plotId];
          return {
            ...planting,
            plantName: plant.friendlyName,
            plotName: plot?.friendlyName,
          };
        });
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