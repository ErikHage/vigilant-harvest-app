<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <page-title title="Add Planting Year"/>
        <v-spacer></v-spacer>
        <fade-out-alert
            v-for="(alert, i) in alerts"
            :key="'alert' + i"
            :is-visible="alert.isVisible"
            :alert-type="alert.type"
            :message="alert.message"
        />
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="fill-height">
          <v-card-title>New year</v-card-title>
          <v-card-text>
            <v-row density="compact">
              <v-col cols="12">
                <v-text-field
                    :model-value="newPlantingYear.previousPlantingYear ?? ''"
                    label="Previous Planting Year"
                    variant="solo"
                    density="compact"
                    hide-details
                    readonly/>
              </v-col>
              <v-col cols="12">
                <v-text-field
                    :model-value="newPlantingYear.plantingYear ?? ''"
                    label="New Planting Year"
                    variant="solo"
                    density="compact"
                    hide-details
                    readonly/>
              </v-col>
              <v-col cols="12">
                <date-picker-dialog-activator
                    :on-submit="setLastFrostDateValue"
                    :date="newPlantingYear.lastFrostDate"
                    title="Set Last Frost Date"
                >
                  <!-- on a click in the field's control: under a frozen test clock, Vue drops an outer listener's events -->
                  <template v-slot:activator="{ open }">
                    <v-text-field
                        @click:control="open"
                        @keydown.enter="open"
                        :model-value="formattedLastFrostDate"
                        class="date-field"
                        label="Last Frost Date"
                        prepend-inner-icon="mdi-calendar"
                        placeholder="Not set"
                        persistent-placeholder
                        variant="solo"
                        density="compact"
                        hide-details
                        readonly/>
                  </template>
                </date-picker-dialog-activator>
              </v-col>
              <v-col cols="12">
                <date-picker-dialog-activator
                    :on-submit="setTargetPlantingDateValue"
                    :date="newPlantingYear.targetPlantingDate"
                    title="Set Target Planting Date"
                >
                  <!-- on a click in the field's control: under a frozen test clock, Vue drops an outer listener's events -->
                  <template v-slot:activator="{ open }">
                    <v-text-field
                        @click:control="open"
                        @keydown.enter="open"
                        :model-value="formattedTargetPlantingDate"
                        class="date-field"
                        label="Target Planting Date"
                        prepend-inner-icon="mdi-calendar"
                        placeholder="Not set"
                        persistent-placeholder
                        variant="solo"
                        density="compact"
                        hide-details
                        readonly/>
                  </template>
                </date-picker-dialog-activator>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <v-card class="fill-height">
          <v-card-title class="text-wrap">Plantings to carry forward (planted)</v-card-title>
          <v-card-text>
            <div class="d-flex align-center ga-3 mb-2">
              <v-btn
                  size="small"
                  variant="outlined"
                  :disabled="plantingsToCarryForward.length === 0"
                  @click="toggleSelectAll"
              >
                {{ allSelected ? 'Deselect all' : 'Select all' }}
              </v-btn>
              <span class="smaller-text">
                {{ selectedPlantingIds.length }} of {{ plantingsToCarryForward.length }} selected
              </span>
            </div>
            <v-table density="compact">
              <thead>
              <tr>
                <th></th>
                <th>Planting</th>
                <th>Plant</th>
                <th>Lifespan</th>
                <th>Status</th>
              </tr>
              </thead>
              <tbody>
              <tr v-if="plantingsToCarryForward.length === 0">
                <td colspan="5" class="smaller-text">{{ nothingToCarryForward }}</td>
              </tr>
              <template v-for="planting in plantingsToCarryForward" :key="planting.plantingId">
                <tr>
                  <td>
                    <v-checkbox-btn
                        v-model="selectedPlantingIds"
                        :value="planting.plantingId"
                        :aria-label="'Carry forward ' + planting.name"
                        density="compact"/>
                  </td>
                  <td>
                    <span class="clickable text-primary font-weight-medium"
                          @click="onClickPlanting(planting.plantingId)">
                      {{ planting.name }}
                    </span>
                  </td>
                  <td>
                    <span class="smaller-text">
                      {{ planting.plantName }}
                    </span>
                  </td>
                  <td>
                    <span class="smaller-text">
                      {{ planting.plantLifespanType }}
                    </span>
                  </td>
                  <td>
                    <v-chip size="small" :color="getStatusColor(planting.currentStatus)">{{ planting.currentStatus }}</v-chip>
                  </td>
                </tr>
              </template>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12">
        <div class="d-flex justify-end">
          <v-btn
            color="success"
            :disabled="!canCreate"
            @click="onCreate"
          >
            Create New Planting Year
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <no-carry-forward-dialog
        :show="showNoCarryForwardDialog"
        :planting-year="newPlantingYear.plantingYear"
        :on-cancel="onCancelNoCarryForward"
        :on-confirm="onConfirmNoCarryForward"
    />
  </v-container>
</template>

<script>
import {mapActions, mapState} from "pinia";
import {usePlantingsStore, usePlantingYearsStore, usePlantsStore} from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import DatePickerDialogActivator from "@/components/utils/DatePickerDialogActivator.vue";
import NoCarryForwardDialog from "@/components/years/NoCarryForwardDialog.vue";
import dayjs from "dayjs";
import plantingUtils from "@/utils/plantings";
import { toLocalDate } from '@/utils/dates';
import { alertOf } from '@/store/alerts';
import { isChosen } from '@/utils/form-rules';

export default {
  name: "AddPlantingYearPage",
  components: {DatePickerDialogActivator, FadeOutAlert, NoCarryForwardDialog, PageTitle},

  data() {
    return {
      // proposed once the years have loaded
      newPlantingYear: {
        previousPlantingYear: null,
        plantingYear: null,
        lastFrostDate: null,
        targetPlantingDate: null,
      },
      // the previous year's, kept here so the store's list, the chosen
      // year's, is left alone
      plantings: [],
      // none at first: the user chooses what to carry
      selectedPlantingIds: [],
      showNoCarryForwardDialog: false,
    };
  },

  computed: {
    // what the service requires: both dates, and a year, which isn't proposed
    // until the years load
    canCreate() {
      return isChosen(this.newPlantingYear.plantingYear) &&
          isChosen(this.newPlantingYear.lastFrostDate) && isChosen(this.newPlantingYear.targetPlantingDate);
    },

    ...mapState(usePlantingYearsStore, {
      plantingYears: 'plantingYears',
    }),

    ...mapState(usePlantsStore, {
      plantsById: 'plantsById',
    }),

    // the plantings and plants carried forward load here too
    alerts() {
      return [usePlantingYearsStore(), usePlantingsStore(), usePlantsStore()].map(alertOf);
    },

    // empty until picked, so the field shows its "Not set" placeholder
    formattedLastFrostDate() {
      return this.newPlantingYear?.lastFrostDate ?
          dayjs(this.newPlantingYear.lastFrostDate).format('YYYY-MM-DD') :
          '';
    },

    formattedTargetPlantingDate() {
      return this.newPlantingYear?.targetPlantingDate ?
          dayjs(this.newPlantingYear.targetPlantingDate).format('YYYY-MM-DD') :
          '';
    },

    nothingToCarryForward() {
      return this.newPlantingYear.previousPlantingYear === null ?
          'No previous year to carry forward from' :
          `Nothing planted in ${this.newPlantingYear.previousPlantingYear}`;
    },

    // what may be carried forward: the planted ones
    plantingsToCarryForward() {
      return this.plantings.filter(planting => planting.currentStatus === "PLANTED")
          .map(planting => ({
            ...planting,
            plantName: this.plantsById[planting.plantId]?.friendlyName ?? '',
            plantLifespanType: this.plantsById[planting.plantId]?.lifespanType ?? '',
          }));
    },

    allSelected() {
      return this.plantingsToCarryForward.length > 0 &&
          this.selectedPlantingIds.length === this.plantingsToCarryForward.length;
    },
  },

  methods: {
    ...mapActions(usePlantingYearsStore, [
      'addPlantingYear',
      'fetchPlantingYears',
    ]),

    ...mapActions(usePlantingsStore, [
      'plantingsOfYear',
    ]),

    ...mapActions(usePlantsStore, [
      'fetchPlants',
    ]),

    // The year after the latest, carrying forward from it. Years more than one
    // past the calendar's don't count: a year added far ahead, by mistake,
    // would otherwise set every proposal after it. With none, this calendar
    // year, carrying nothing forward
    proposeYears() {
      const nextCalendarYear = new Date().getFullYear() + 1;
      const years = this.plantingYears
          .map(year => year.plantingYear)
          .filter(year => year <= nextCalendarYear);

      if (years.length === 0) {
        this.newPlantingYear.plantingYear = nextCalendarYear - 1;
        return;
      }

      const latest = Math.max(...years);
      this.newPlantingYear.previousPlantingYear = latest;
      this.newPlantingYear.plantingYear = latest + 1;
    },

    getStatusColor(value) {
      return plantingUtils.mapPlantingStatusToColor(value);
    },

    setLastFrostDateValue(date) {
      this.newPlantingYear.lastFrostDate = date;
    },

    setTargetPlantingDateValue(date) {
      this.newPlantingYear.targetPlantingDate = date;
    },

    onClickPlanting(plantingId) {
      this.$router.push({
        name: 'PlantingDetailsPage',
        params: {
          plantingId,
        },
      });
    },

    toggleSelectAll() {
      this.selectedPlantingIds = this.allSelected
          ? []
          : this.plantingsToCarryForward.map(planting => planting.plantingId);
    },

    // Carrying nothing forward from a year that exists is rare, and a perennial
    // retired by mistake would leave the list empty, so it is confirmed even then
    onCreate() {
      if (this.newPlantingYear.previousPlantingYear !== null && this.selectedPlantingIds.length === 0) {
        this.showNoCarryForwardDialog = true;
        return;
      }
      return this.onSubmit();
    },

    onCancelNoCarryForward() {
      this.showNoCarryForwardDialog = false;
    },

    async onConfirmNoCarryForward() {
      this.showNoCarryForwardDialog = false;
      await this.onSubmit();
    },

    async onSubmit() {
      // with no previous year, both are left out: nothing is carried
      const { previousPlantingYear, ...newPlantingYear } = this.newPlantingYear;

      try {
        await this.addPlantingYear({
          ...newPlantingYear,
          ...(previousPlantingYear === null ? {} : {
            previousPlantingYear,
            carryForwardPlantingIds: this.selectedPlantingIds,
          }),
          lastFrostDate: toLocalDate(this.newPlantingYear.lastFrostDate),
          targetPlantingDate: toLocalDate(this.newPlantingYear.targetPlantingDate),
        });
        this.$router.push({
          name: 'PlantingYearsPage',
        });
      } catch {
        // don't go back, error should show
      }
    }
  },

  async mounted() {
    // nothing is proposed if the years don't load: the store's alert shows,
    // and Create stays off
    if (await this.fetchPlantingYears()) {
      this.proposeYears();
    }
    if (this.newPlantingYear.previousPlantingYear !== null) {
      this.plantings = await this.plantingsOfYear(this.newPlantingYear.previousPlantingYear);
    }
    await this.fetchPlants();
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

.date-field :deep(input) {
  cursor: pointer;
}

.smaller-text {
  font-size: 0.8rem;
  color: gray;
}
</style>
