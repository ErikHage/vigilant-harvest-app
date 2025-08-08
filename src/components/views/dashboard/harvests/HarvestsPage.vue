<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <page-title title="Review Harvests"/>
        <v-spacer></v-spacer>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="2" class="timeline-column d-flex flex-column">
        <div class="timeline flex-grow-1 overflow-y-auto">
          <div
              v-for="(entry, index) in timelineEntries"
              :key="index"
              class="timeline-entry"
              :class="{ selected: selectedDate === entry, ellipsis: entry === '...' }"
              @click="entry !== '...' && (selectedDate = entry)"
          >
            {{ entry === '...' ? '...' : formatDate(entry) }}
          </div>
        </div>
      </v-col>

      <v-col cols="10" class="content-column">
        <div v-if="selectedDate">
          <v-card class="pa-4">
            <div class="d-flex justify-space-between">
              <h3>{{ formatDate(selectedDate) }}</h3>
              <v-btn
                  size="small"
                  color="warning"
                  @click="showEditHarvestsDialog(hydratedHarvestsByDate[selectedDate])"
              >
                <v-icon>mdi-pencil</v-icon>&nbsp;Edit
              </v-btn>
            </div>
            <v-divider class="my-4"/>

            <template
                v-for="plantGroup in groupedHarvests"
                :key="plantGroup.plantName"
            >
              <div class="chip-row">
                <div class="d-flex align-center" @click="toggleExpanded(plantGroup.plantName)"
                     style="cursor: pointer;">
                  <v-chip
                      :color="getQuantityColor(plantGroup.totalQuantity)"
                      class="fixed-width-chip"
                      size="small"
                  >
                    {{ plantGroup.totalQuantity }}
                  </v-chip>

                  <div class="ml-3 plant-name">
                    {{ plantGroup.plantName }}
                  </div>

                  <v-icon small class="ml-2">
                    {{ expandedPlants.includes(plantGroup.plantName) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                  </v-icon>
                </div>

                <div
                    v-if="expandedPlants.includes(plantGroup.plantName)"
                    class="ml-10"
                >
                  <div
                      v-for="harvest in plantGroup.harvests"
                      :key="harvest.harvestId"
                      class="breakdown-row mb-1"
                  >
                    • {{ harvest.plantingName }} – {{ harvest.quantity }}
                  </div>
                </div>
              </div>
            </template>
          </v-card>
        </div>
        <div v-else class="pa-4">Select a date from the timeline to see harvests.</div>
      </v-col>
    </v-row>

    <edit-harvests-dialog
        :show="editHarvestsDialog"
        :harvests="selectedHarvests"
        :on-submit="updateHarvests"
        :on-cancel="onCloseEditHarvestsDialog"
    />
  </v-container>
</template>

<script>
import dayjs from 'dayjs';
import {mapActions, mapState} from "pinia";

import {useCommonStore, useHarvestsStore, usePlantingsStore, usePlantsStore} from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import EditHarvestsDialog from "@/components/harvests/EditHarvestsDialog.vue";

export default {
  name: 'HarvestsPage',

  components: {
    PageTitle,
    EditHarvestsDialog,
  },

  data: () => ({
    editHarvestsDialog: false,
    harvestDates: [],
    hydratedHarvestsByDate: {},
    selectedHarvests: [],
    timelineEntries: [],
    selectedDate: null,
    expandedPlants: [],
  }),

  computed: {
    ...mapState(useCommonStore, {
      plantingYear: 'plantingYear',
    }),

    ...mapState(usePlantsStore, {
      plantsById: 'plantsById',
    }),

    ...mapState(usePlantingsStore, {
      plantingsById: 'plantingsById',
    }),

    ...mapState(useHarvestsStore, {
      harvests: 'harvests',
    }),

    groupedHarvests() {
      const harvestsByPlant = this.hydratedHarvestsByDate?.[this.selectedDate] ?? {};
      const grouped = {};

      for (const [plantName, harvestArray] of Object.entries(harvestsByPlant)) {
        for (const harvest of harvestArray) {
          if (!grouped[plantName]) {
            grouped[plantName] = {
              plantName: plantName,
              totalQuantity: 0,
              harvests: [],
            };
          }

          grouped[plantName].totalQuantity += harvest.quantity;
          grouped[plantName].harvests.push(harvest);
        }
      }

      // Sort alphabetically by plantName
      return Object.values(grouped).sort((a, b) =>
          a.plantName.localeCompare(b.plantName)
      );
    },
  },

  methods: {
    ...mapActions(usePlantsStore, [
      'fetchPlants',
    ]),

    ...mapActions(usePlantingsStore, [
      'fetchPlantingsByYear',
    ]),

    ...mapActions(useHarvestsStore, [
      'searchHarvests',
      'upsertHarvests',
    ]),

    async refreshData() {
      await this.fetchPlants();
      await this.searchHarvests(this.plantingYear);
      await this.fetchPlantingsByYear(this.plantingYear);

      this.hydratedHarvestsByDate = this.harvests
          .map(harvest => {
            const planting = this.plantingsById[harvest.plantingId];
            const plant = this.plantsById[planting.plantId];
            return {
              ...harvest,
              plantName: plant.friendlyName,
              plantingName: planting.name,
            };
          })
          .reduce((acc, hydratedHarvest) => {
            const harvestDate = this.formatDate(hydratedHarvest.harvestDate);
            if (!acc[harvestDate]) acc[harvestDate] = {};

            const plantName = hydratedHarvest.plantName;
            if (!acc[harvestDate][plantName]) acc[harvestDate][plantName] = [];

            acc[harvestDate][plantName].push(hydratedHarvest);
            return acc;
          }, {});

      this.harvestDates = Object.keys(this.hydratedHarvestsByDate).sort().reverse();

      const withEllipsis = [];
      for (let i = 0; i < this.harvestDates.length; i++) {
        const current = dayjs(this.harvestDates[i]);
        withEllipsis.push(this.harvestDates[i]);

        if (i < this.harvestDates.length - 1) {
          const next = dayjs(this.harvestDates[i + 1]);
          const dayDiff = current.diff(next, 'day');

          // Insert "..." for each missing day
          if (dayDiff > 1) {
            withEllipsis.push("...");
          }
        }
      }

      this.timelineEntries = withEllipsis;

      this.selectedDate = this.harvestDates[0] || null;
    },

    showEditHarvestsDialog(harvests) {
      // is multi-value map of plant to harvest (per planting), need to flatten out to edit.
      this.selectedHarvests = Object.values(harvests)
          .flatMap(h => h);
      this.editHarvestsDialog = true;
    },

    async updateHarvests(harvests) {
      await this.upsertHarvests(harvests);
      this.onCloseEditHarvestsDialog();
    },

    onCloseEditHarvestsDialog() {
      this.selectedHarvests = [];
      this.editHarvestsDialog = false;
    },

    formatDate(date) {
      return dayjs(date).format('YYYY-MM-DD');
    },

    getQuantityColor(quantity) {
      if (quantity <= 1) return "#4575b4";
      if (quantity <= 5) return "#91bfdb";
      if (quantity <= 10) return "#ffffbf";
      if (quantity <= 20) return "#fdae61";
      return "#d73027";
    },

    toggleExpanded(plantName) {
      if (this.expandedPlants.includes(plantName)) {
        this.expandedPlants = this.expandedPlants.filter(name => name !== plantName);
      } else {
        this.expandedPlants.push(plantName);
      }
    },
  },

  async mounted() {
    await this.refreshData();
  }
}
</script>

<style scoped>
.timeline-column {
  max-height: 70vh;
  overflow: hidden;
  border-right: 1px solid #ccc;
}

.timeline {
  overflow-y: auto;
  flex-grow: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.timeline-entry {
  cursor: pointer;
  padding: 8px 12px;
  margin: 0;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 14px;
}

.timeline-entry.selected {
  background-color: darkgreen;
  color: white;
  font-weight: bold;
  transform: scale(1.05);
}

.timeline-entry.ellipsis {
  pointer-events: none;
  color: #888;
  text-align: center;
  font-style: italic;
  font-size: 14px;
  margin: 4px 0;
}

.content-column {
  max-height: 75vh;
  overflow-y: auto;
  padding: 20px;
}

.no-lines td {
  border: none !important;
}

.chip-row {
  margin-bottom: 10px;
}

.fixed-width-chip {
  width: 45px;
  justify-content: center;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.plant-name {
  font-weight: 500;
  font-size: 16px;
}

.breakdown-row {
  font-size: 14px;
  color: #444;
  margin-left: 14px;
}
</style>
