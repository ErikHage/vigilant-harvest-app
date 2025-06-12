<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <page-title title="Review Harvests"/>
        <v-spacer></v-spacer>
        <v-btn class="mt-3" color="primary" @click="refreshData">Refresh</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="2" class="timeline-column">
        <div class="timeline">
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
          <v-row>
            <v-col class="text-right">
              <v-btn
                  size="small"
                  color="default"
                  @click="showEditHarvestsDialog(hydratedHarvestsByDate[selectedDate])"
              >
                <v-icon>mdi-pencil</v-icon> Edit
              </v-btn>
            </v-col>
          </v-row>

          <v-card class="pa-4">
            <h3>{{ formatDate(selectedDate) }}</h3>
            <v-divider class="my-4" />

            <v-table class="no-lines" density="compact">
              <tbody>
              <tr
                  v-for="harvest in hydratedHarvestsByDate[selectedDate]"
                  :key="harvest.harvestId"
              >
                <td class="quantity-column text-right">
                  <v-chip :color="getQuantityColor(harvest.quantity)">
                    {{ harvest.quantity }}
                  </v-chip>
                </td>
                <td class="planting-column text-left">{{ harvest.plantName }}</td>
              </tr>
              </tbody>
            </v-table>
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

import { mapActions, mapState } from "pinia";
import { useCommonStore, useHarvestsStore, usePlantingsStore, usePlantsStore } from "@/store";
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
            return {
              ...harvest,
              plantName: this.plantsById[this.plantingsById[harvest.plantingId].plantId].friendlyName,
            };
          })
          .reduce((acc, hydratedHarvest) => {
            let harvestDate = hydratedHarvest.harvestDate;

            if (!acc[harvestDate]) {
              acc[harvestDate] = [];
            }

            acc[harvestDate].push(hydratedHarvest);
            return acc;
          }, {});

      this.harvestDates = Object.keys(this.hydratedHarvestsByDate).sort().reverse();

      const withEllipsis = [];
      for (let i = 0; i < this.harvestDates.length; i++) {
        const current = new Date(this.harvestDates[i]);
        withEllipsis.push(this.harvestDates[i]);

        if (i < this.harvestDates.length - 1) {
          const next = new Date(this.harvestDates[i + 1]);
          let dayDiff = Math.floor((current - next) / (1000 * 60 * 60 * 24));

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
      this.selectedHarvests = harvests;
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
      return new Date(date).toLocaleDateString('sv-SE');
    },

    getQuantityColor(quantity) {
      if (quantity <= 1) return "#4575b4";
      if (quantity <= 5) return "#91bfdb";
      if (quantity <= 10) return "#ffffbf";
      if (quantity <= 20) return "#fdae61";
      return "#d73027";
    }
  },

  async mounted() {
    await this.refreshData();
  }
}
</script>

<style scoped>
.timeline-column {
  max-height: 75vh;
  overflow-y: auto;
  border-right: 1px solid #ccc;
}

.timeline {
  display: flex;
  flex-direction: column;
  padding: 4px;
  gap: 2px;
}

.timeline-entry {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.2;
  transition: background 0.2s ease;
  margin-bottom: 2px;
}

.timeline-entry.selected {
  background-color: darkgreen;
  color: white;
  font-weight: bold;
}

.timeline-entry.ellipsis {
  pointer-events: none;
  color: #aaa;
  text-align: center;
  font-style: italic;
  font-size: 10px;
  margin: 2px 0;
}

.content-column {
  max-height: 75vh;
  overflow-y: auto;
  padding: 20px;
}

.no-lines td {
  border: none !important;
}
</style>
