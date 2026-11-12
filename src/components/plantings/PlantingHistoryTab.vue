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
          {{ describeComment(historyItem.comment) }}
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
    getColorForStatus(status) {
      return plantingUtils.mapPlantingStatusToColor(status);
    },

    showStatusChip(historyItem) {
      return historyItem.plantingStatus !== plantingActions.comment;
    },

    // the service files a creation and an update as JSON
    describeComment(comment) {
      return plantingUtils.describeHistoryComment(comment);
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