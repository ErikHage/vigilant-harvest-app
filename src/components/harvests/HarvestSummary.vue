<template>
  <v-card>
    <v-card-title class="d-flex justify-start mb-2">
      <h4>{{ hydratedPlot.friendlyName }}</h4>
    </v-card-title>
    <v-card-text>
      <template v-for="planting in hydratedPlot.plantings">
        <div class="d-flex justify-space-between align-center mb-1">
          <v-chip class="ml-2 mr-2"
                  color="green">
            {{ planting.numberTransplanted }}
            <v-icon class="ml-1">mdi-leaf</v-icon>
          </v-chip>

          <div class="d-flex flex-column align-center">
            <span class="clickable text-primary font-weight-medium"
                  @click="onClickPlanting(planting.plantingId)">
            {{ planting.name }}
            </span>
            <span class="clickable smaller-text"
                  @click="onClickPlant(planting.plant.plantId)">
            {{ planting.plant.friendlyName }}
            </span>
          </div>

          <v-chip v-if="planting.currentStatus === 'RETIRED'"
                  color="#8B0000">
            {{ planting.harvestQuantity }}
            <v-icon class="ml-1">mdi-basket-fill</v-icon>
          </v-chip>

          <v-chip v-else-if="planting.harvestQuantity > 0"
                  color="yellow">
            {{ planting.harvestQuantity }}
            <v-icon class="ml-1">mdi-basket-fill</v-icon>
          </v-chip>

          <v-chip v-else
                  color="grey">
            <v-icon>mdi-basket</v-icon>
          </v-chip>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'HarvestSummary',

  props: {
    hydratedPlot: Object,
  },

  methods: {
    onClickPlanting(plantingId) {
      this.$router.push({
        name: 'PlantingDetailsPage',
        params: {
          plantingId,
        },
      });
    },

    onClickPlant(plantId) {
      this.$router.push({
        name: 'PlantDetailsPage',
        params: {
          plantId,
        },
      });
    }
  },
}
</script>

<style scoped>
.clickable {
  cursor: pointer;
  transition: color 0.2s;
}

.clickable:hover {
  color: #1976D2; /* Vuetify primary color */
  text-decoration: underline;
}

.smaller-text {
  font-size: 0.8rem;
  color: gray;
}
</style>
