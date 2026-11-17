<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <page-title title="Review Harvests"/>
        <v-spacer></v-spacer>
        <fade-out-alert
            v-for="(alert, i) in alerts"
            :key="'alert' + i"
            :is-visible="alert.isVisible"
            :alert-type="alert.type"
            :message="alert.message"
        />
      </v-col>
    </v-row>

    <!-- the harvests wait for the load, so nothing shows from a year left in the store -->
    <day-timeline
        v-model="selectedDay"
        :records="loaded ? hydratedHarvests : []"
        :date-of="harvest => harvest.harvestDate"
    >
      <template #actions="{ records }">
        <v-btn
            size="small"
            color="warning"
            @click="showEditHarvestsDialog(records)"
        >
          <v-icon>mdi-pencil</v-icon>&nbsp;Edit
        </v-btn>
      </template>

      <template #day="{ records }">
        <template
            v-for="plantGroup in byPlant(records)"
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
      </template>

      <template #empty>
        <div v-if="loaded" class="pa-4">No harvests in {{ plantingYear }}.</div>
      </template>
    </day-timeline>

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
import {mapActions, mapState} from "pinia";

import {useCommonStore, useHarvestsStore, usePlantingsStore, usePlantsStore} from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import EditHarvestsDialog from "@/components/harvests/EditHarvestsDialog.vue";
import DayTimeline from "@/components/utils/DayTimeline.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import harvestUtils from "@/utils/harvest-utils";
import { alertOf } from "@/store/alerts";

export default {
  name: 'HarvestsPage',

  components: {
    PageTitle,
    DayTimeline,
    EditHarvestsDialog,
    FadeOutAlert,
  },

  data: () => ({
    editHarvestsDialog: false,
    editHarvestsErrorMessage: '',
    selectedHarvests: [],
    selectedDay: null,
    expandedPlants: [],
    loaded: false,
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
    }),

    alerts() {
      return [useHarvestsStore(), usePlantsStore(), usePlantingsStore()].map(alertOf);
    },

    // a planting or plant that didn't load: the harvest shows without
    // its name, and the store's alert says why
    hydratedHarvests() {
      return this.harvests.map(harvest => {
        const planting = this.plantingsById[harvest.plantingId];
        const plant = this.plantsById[planting?.plantId];
        return {
          ...harvest,
          plantName: plant?.friendlyName ?? '',
          plantingName: planting?.name ?? '',
        };
      });
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
      'deleteHarvest',
      'searchHarvests',
      'upsertHarvests',
    ]),

    async refreshData() {
      await this.fetchPlants();
      await this.fetchHarvestTypes();
      await this.searchHarvests(this.plantingYear);
      await this.fetchPlantingsByYear(this.plantingYear);
      this.loaded = true;
    },

    // A day's harvests by plant, by name. A plant can hold harvests of more
    // than one type, and pounds cannot be added to count, so each type is
    // totalled apart, largest first
    byPlant(harvests) {
      const grouped = {};

      for (const harvest of harvests) {
        const group = grouped[harvest.plantName] ??= {
          plantName: harvest.plantName,
          totalsByType: {},
          harvests: [],
        };

        const total = group.totalsByType[harvest.harvestTypeId] ??= {
          harvestTypeId: harvest.harvestTypeId,
          harvestType: harvest.harvestType,
          quantity: 0,
        };
        total.quantity += harvest.quantity;

        group.harvests.push(harvest);
      }

      return Object.values(grouped)
          .map(group => ({
            ...group,
            totalsByType: Object.values(group.totalsByType).sort(harvestUtils.sortByQuantityDescending),
          }))
          .sort((a, b) => a.plantName.localeCompare(b.plantName));
    },

    showEditHarvestsDialog(harvests) {
      this.editHarvestsErrorMessage = '';
      this.selectedHarvests = [...harvests];
      this.editHarvestsDialog = true;
    },

    // Deletes those removed, then saves the rest. A delete of one already
    // gone is answered 200, so trying again after a failure is safe
    async updateHarvests(harvests, removedIds = []) {
      try {
        for (const harvestId of removedIds) {
          await this.deleteHarvest(harvestId);
        }
      } catch {
        this.editHarvestsErrorMessage = 'error deleting harvest';
        return;
      }

      const payload = harvests.map(harvest => ({
        harvestId: harvest.harvestId,
        plantingYear: this.plantingYear,
        plantingId: harvest.plantingId,
        quantity: harvest.quantity,
        harvestDate: harvest.harvestDate,
        harvestTypeId: harvest.harvestTypeId,
      }));

      try {
        if (payload.length > 0) {
          await this.upsertHarvests(payload);
        }
      } catch (err) {
        // keep the dialog open so the entries survive a rejected harvest type id
        this.editHarvestsErrorMessage = harvestUtils.upsertErrorMessage(err, 'error updating harvests');
        return;
      }

      // retyping can absorb a row into another harvest, so an id we sent may no longer exist.
      // refetch rather than reconciling against the response. The timeline stays on the day,
      // or goes to the newest when the day has no harvests left
      this.onCloseEditHarvestsDialog();
      await this.refreshData();
    },

    onCloseEditHarvestsDialog() {
      this.editHarvestsErrorMessage = '';
      this.selectedHarvests = [];
      this.editHarvestsDialog = false;
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
