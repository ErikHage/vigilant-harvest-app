<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="text-center">
        <page-title title="Add Planting Year"/>
        <v-spacer></v-spacer>
        <fade-out-alert
            :is-visible="alert.isVisible"
            :alert-type="alert.type"
            :message="alert.message"/>
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
              <h3>Plantings to carry forward (not retired)</h3>
              <v-table>
                <tbody>
                <template v-for="planting in notRetiredPlantings" :key="planting.plantingId">
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

export default {
  name: "AddPlantingYearPage",
  components: {DatePickerDialogActivator, FadeOutAlert, PageTitle},

  data() {
    return {
      newPlantingYear: {
        previousPlantingYear: new Date().getFullYear(),
        plantingYear: new Date().getFullYear() + 1,
        lastFrostDate: null,
        targetPlantingDate: null,
      },
    };
  },

  computed: {
    ...mapState(usePlantingYearsStore, {
      plantingYears: 'plantingYears',
      alertType: 'alertType',
      alertMessage: 'alertMessage',
      alertVisible: 'alertVisible',
    }),

    ...mapState(usePlantingsStore, {
      plantings: 'plantings',
    }),

    ...mapState(usePlantsStore, {
      plantsById: 'plantsById',
    }),

    alert() {
      return {
        isVisible: this.alertVisible,
        type: this.alertType,
        message: this.alertMessage,
      };
    },

    currentPlantingYear() {
      return new Date().getFullYear();
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

    notRetiredPlantings() {
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
      'fetchPlantingsByYear',
    ]),

    ...mapActions(usePlantsStore, [
      'fetchPlants',
    ]),

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
      try {
        await this.addPlantingYear(this.newPlantingYear);
        this.$router.push({
          name: 'PlantingYearsPage',
        });
      } catch (err) {
        // don't go back, error should show
      }
    }
  },

  async mounted() {
    await this.fetchPlantingYears();
    await this.fetchPlantingsByYear(this.currentPlantingYear);
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
