<template>
  <v-card>
    <v-card-title class="d-flex justify-start mb-2">
      <h4>{{ hydratedPlot.friendlyName }}</h4>
    </v-card-title>
    <v-card-text>
      <div v-if="displayedPlantings.length === 0" class="text-center">
        <p>No active plantings</p>
      </div>

      <div v-else class="plantings-grid">
        <template v-for="(planting, index) in displayedPlantings" :key="planting.plantingId">
          <v-chip class="leaf-chip" color="green">
            {{ planting.numberTransplanted }}
            <v-icon class="ml-1">mdi-leaf</v-icon>
          </v-chip>

          <div class="planting-names">
            <span class="clickable text-primary font-weight-medium name-line"
                  :title="planting.name"
                  @click="onClickPlanting(planting.plantingId)">{{ planting.name }}</span>
            <!-- a plant that didn't load: the planting shows without it -->
            <span v-if="planting.plant"
                  class="clickable smaller-text name-line"
                  :title="planting.plant.friendlyName"
                  @click="onClickPlant(planting.plant.plantId)">{{ planting.plant.friendlyName }}</span>
          </div>

          <div class="harvest-chips">
            <template v-if="planting.harvestQuantities.length > 0">
              <v-chip v-for="harvestQuantity in planting.harvestQuantities"
                      :key="harvestQuantity.harvestTypeId"
                      size="small"
                      :color="planting.currentStatus === 'RETIRED' ? '#8B0000' : 'yellow'">
                {{ formatQuantity(harvestQuantity.quantity, harvestQuantity.harvestType) }}
                <v-icon class="ml-1">mdi-basket-fill</v-icon>
              </v-chip>
            </template>

            <v-chip v-else
                    size="small"
                    color="grey">
              <v-icon>mdi-basket</v-icon>
            </v-chip>
          </div>

          <v-divider v-if="index < displayedPlantings.length - 1" class="planting-divider"/>
        </template>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import harvestUtils from "@/utils/harvest-utils";

export default {
  name: 'HarvestSummary',

  props: {
    hydratedPlot: {
      type: Object,
      required: true,
    },
    showRetired: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    displayedPlantings() {
      if (this.showRetired) {
        return this.hydratedPlot.plantings;
      }
      return this.hydratedPlot.plantings.filter(planting => planting.currentStatus !== 'RETIRED');
    }
  },

  methods: {
    formatQuantity(quantity, harvestType) {
      return harvestUtils.formatQuantity(quantity, harvestType);
    },

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
/* one grid for the whole card, so every planting row shares the same column edges */
.plantings-grid {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  column-gap: 12px;
  row-gap: 8px;
  align-items: center;
}

/* minmax(0, 1fr) above plus this lets the cell shrink so the names can truncate */
.planting-names {
  min-width: 0;
}

.name-line {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.harvest-chips {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
}

/* stretching the chips to fill their auto-sized track lines the icons up in a column */
.leaf-chip,
.harvest-chips .v-chip {
  justify-content: flex-end;
  font-variant-numeric: tabular-nums;
}

.planting-divider {
  grid-column: 1 / -1;
}

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
