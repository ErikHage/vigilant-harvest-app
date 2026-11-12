<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
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

      <v-col cols="12">
        <v-sheet class="pa-4">
          <v-row>
            <v-col cols="12">
              <v-text-field
                  v-model.number="newPlantingYear.previousPlantingYear"
                  label="Previous Planting Year"
                  variant="solo"
                  type="number"
                  density="compact"
                  :disabled="true"/>

              <v-text-field
                  v-model.number="newPlantingYear.plantingYear"
                  class="mb-4"
                  label="New Planting Year"
                  variant="solo"
                  type="number"
                  density="compact"
                  :disabled="true"/>

              <div class="d-flex align-center mb-6">
                <h3 class="mr-2">Last Frost Date</h3>
                <date-picker-dialog-activator
                    :on-submit="setLastFrostDateValue"
                    title="Set Last Frost Date"
                />
                <h3 class="ml-2">{{ formattedLastFrostDate }}</h3>
              </div>

              <div class="d-flex align-center mb-4">
                <h3 class="mr-2">Target Planting Date</h3>
                <date-picker-dialog-activator
                    :on-submit="setTargetPlantingDateValue"
                    title="Set Target Planting Date"
                />
                <h3 class="ml-2">{{ formattedTargetPlantingDate }}</h3>
              </div>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" lg="6">
              <h3>Plantings to carry forward (planted)</h3>
              <v-table>
                <tbody>
                <template v-for="planting in plantingsToCarryForward" :key="planting.plantingId">
                  <tr>
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
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <div class="d-flex justify-end">
                <v-btn
                  color="success"
                  :disabled="!canCreate"
                  @click="onSubmit"
                >
                  Create New Planting Year
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import {mapActions, mapState} from "pinia";
import {usePlantingsStore, usePlantingYearsStore, usePlantsStore} from "@/store";
import PageTitle from "@/components/layout/PageTitle.vue";
import FadeOutAlert from "@/components/utils/FadeOutAlert.vue";
import DatePickerDialogActivator from "@/components/utils/DatePickerDialogActivator.vue";
import dayjs from "dayjs";
import plantingUtils from "@/utils/plantings";
import { toLocalDate } from '@/utils/dates';
import { alertOf } from '@/store/alerts';
import { isChosen } from '@/utils/form-rules';

export default {
  name: "AddPlantingYearPage",
  components: {DatePickerDialogActivator, FadeOutAlert, PageTitle},

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

    formattedLastFrostDate() {
      return this.newPlantingYear?.lastFrostDate ?
          dayjs(this.newPlantingYear.lastFrostDate).format('YYYY-MM-DD') :
          '--';
    },

    formattedTargetPlantingDate() {
      return this.newPlantingYear?.targetPlantingDate ?
          dayjs(this.newPlantingYear.targetPlantingDate).format('YYYY-MM-DD') :
          '--';
    },

    // what the service carries forward: the planted ones
    plantingsToCarryForward() {
      return this.plantings.filter(planting => planting.currentStatus === "PLANTED")
          .map(planting => ({
            ...planting,
            plantName: this.plantsById[planting.plantId]?.friendlyName ?? '',
            plantLifespanType: this.plantsById[planting.plantId]?.lifespanType ?? '',
          }));
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

    async onSubmit() {
      // with no previous year, the field is left out: nothing is carried
      const { previousPlantingYear, ...newPlantingYear } = this.newPlantingYear;

      try {
        await this.addPlantingYear({
          ...newPlantingYear,
          ...(previousPlantingYear === null ? {} : { previousPlantingYear }),
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

.smaller-text {
  font-size: 0.8rem;
  color: gray;
}
</style>
