<template>
  <v-card
      v-for="historyItem in history"
      class="mt-1">
    <v-card-text>
      <div class="d-flex align-center">
        <p class="mr-4">
          {{ new Date(historyItem.dateCreated).toLocaleDateString() }}
        </p>
        <v-chip
            v-if="showStatusChip(historyItem)"
            class="status-chip mr-4 d-flex justify-center"
            :color="getColorForStatus(historyItem.plantingStatus)">
          {{ historyItem.plantingStatus }}
        </v-chip>
        <p v-if="historyItem.comment" class="multiline">
          {{ historyItem.comment }}
        </p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import plantingUtils from "@/utils/plantings";

const { plantingActions } = plantingUtils;

export default {
  name: "PlantingHistoryTab",

  props: {
    history: Array,
  },

  methods: {
    navigateToPlotDetails(plotId) {
      console.log('plot clicked, do something in the future');
    },

    navigateToPlantDetails(plantId) {
      this.$router.push({
        name: 'PlantDetailsPage',
        params: {
          plantId,
        },
      });
    },

    getColorForStatus(status) {
      return plantingUtils.mapPlantingStatusToColor(status);
    },

    showStatusChip(historyItem) {
      return historyItem.plantingStatus !== plantingActions.comment;
    },
  },
}
</script>

<style scoped>
.status-chip {
  min-width: 85px;
}
.multiline {
  white-space: pre-wrap;
}
</style>