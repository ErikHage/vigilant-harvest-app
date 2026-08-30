<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <page-title title="Review Harvests"/>
        <v-spacer></v-spacer>
        <fade-out-alert :is-visible="alert.isVisible" :alert-type="alert.type" :message="alert.message"/>
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
                  <div class="d-flex flex-wrap ga-1">
                    <v-chip
                        v-for="total in plantGroup.totalsByType"
                        :key="total.harvestTypeId"
                        :color="getQuantityColor(total.quantity)"
                        class="fixed-width-chip"
                        size="small"
                    >
                      {{ formatQuantity(total.quantity, total.harvestType) }}
                    </v-chip>
                  </div>

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
                    • {{ harvest.plantingName }} – {{ formatQuantity(harvest.quantity, harvest.harvestType) }}
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
        :harvest-types="harvestTypes"
        :error-message="editHarvestsErrorMessage"
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
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import harvestUtils from "@/utils/harvest-utils";

export default {
  name: 'HarvestsPage',

  components: {
    PageTitle,
    EditHarvestsDialog,
    FadeOutAlert,
  },

  data: () => ({
    editHarvestsDialog: false,
    editHarvestsErrorMessage: '',
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
      harvestTypes: 'harvestTypes',
    }),

    ...mapState(usePlantingsStore, {
      plantingsById: 'plantingsById',
    }),

    ...mapState(useHarvestsStore, {
      harvests: 'harvests',
      alertType: 'alertType',
      alertMessage: 'alertMessage',
      alertVisible: 'alertVisible',
    }),

    alert() {
      return {
        isVisible: this.alertVisible,
        type: this.alertType,
        message: this.alertMessage,
      };
    },

    groupedHarvests() {
      const harvestsByPlant = this.hydratedHarvestsByDate?.[this.selectedDate] ?? {};
      const grouped = {};

      for (const [plantName, harvestArray] of Object.entries(harvestsByPlant)) {
        for (const harvest of harvestArray) {
          if (!grouped[plantName]) {
            grouped[plantName] = {
              plantName: plantName,
              totalsByType: {},
              harvests: [],
            };
          }

          // a plant can hold harvests of more than one type, and pounds cannot be added to count
          const totalsByType = grouped[plantName].totalsByType;
          if (!totalsByType[harvest.harvestTypeId]) {
            totalsByType[harvest.harvestTypeId] = {
              harvestTypeId: harvest.harvestTypeId,
              harvestType: harvest.harvestType,
              quantity: 0,
            };
          }
          totalsByType[harvest.harvestTypeId].quantity += harvest.quantity;

          grouped[plantName].harvests.push(harvest);
        }
      }

      // Sort alphabetically by plantName
      return Object.values(grouped)
          .map(plantGroup => ({
            ...plantGroup,
            totalsByType: Object.values(plantGroup.totalsByType).sort(harvestUtils.sortByQuantityDescending),
          }))
          .sort((a, b) => a.plantName.localeCompare(b.plantName));
    },
  },

  methods: {
    ...mapActions(usePlantsStore, [
      'fetchPlants',
      'fetchHarvestTypes',
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
      await this.fetchHarvestTypes();
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
      this.editHarvestsErrorMessage = '';
      // is multi-value map of plant to harvest (per planting), need to flatten out to edit.
      this.selectedHarvests = Object.values(harvests)
          .flatMap(h => h);
      this.editHarvestsDialog = true;
    },

    async updateHarvests(harvests) {
      const payload = harvests.map(harvest => ({
        harvestId: harvest.harvestId,
        plantingYear: this.plantingYear,
        plantingId: harvest.plantingId,
        quantity: harvest.quantity,
        harvestDate: harvest.harvestDate,
        harvestTypeId: harvest.harvestTypeId,
      }));

      try {
        await this.upsertHarvests(payload);
      } catch (err) {
        // keep the dialog open so the entries survive a rejected harvest type id
        this.editHarvestsErrorMessage = harvestUtils.upsertErrorMessage(err, 'error updating harvests');
        return;
      }

      // retyping can absorb a row into another harvest, so an id we sent may no longer exist.
      // refetch rather than reconciling against the response. refreshData resets selectedDate.
      const previouslySelectedDate = this.selectedDate;
      this.onCloseEditHarvestsDialog();
      await this.refreshData();
      if (this.harvestDates.includes(previouslySelectedDate)) {
        this.selectedDate = previouslySelectedDate;
      }
    },

    onCloseEditHarvestsDialog() {
      this.editHarvestsErrorMessage = '';
      this.selectedHarvests = [];
      this.editHarvestsDialog = false;
    },

    formatDate(date) {
      return dayjs(date).format('YYYY-MM-DD');
    },

    formatQuantity(quantity, harvestType) {
      return harvestUtils.formatQuantity(quantity, harvestType);
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
  min-width: 45px;
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
